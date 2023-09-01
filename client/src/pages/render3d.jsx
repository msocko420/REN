import React, { useRef, useEffect, useState } from 'react';
import axios from 'axios';
import * as THREE from 'three';
import { OBJLoader } from '../three.js-master/examples/jsm/loaders/OBJLoader';
import { OrbitControls } from 'three-stdlib';
import { OBJExporter } from '../three.js-master/examples/jsm/exporters/OBJExporter';
import { motion } from 'framer-motion';

const Render3D = () => {
  const [textPrompt, setTextPrompt] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [renderedObject, setRenderedObject] = useState(null);
  const containerRef = useRef(null);
  const backgroundRef = useRef(null);  // Ref for the Vanta.js background

  useEffect(() => {
    // VANTA.js initialization
    const vantaEffect = window.VANTA.NET({
      el: backgroundRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      scaleMobile: 1.00,
      color: 0xe3cb2d,
      backgroundColor: 0x47474d,
      points: 15.00,
      maxDistance: 25.00,
      spacing: 16.00
    });

    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, []);

  const handleTextInputChange = (e) => {
    setTextPrompt(e.target.value);
  };

  const handleFileInputChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const downloadObjectAsObj = () => {
    if (!renderedObject) {
      alert('No object to download!');
      return;
    }

    const exporter = new OBJExporter();
    const result = exporter.parse(renderedObject);

    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'renderedObject.obj';

    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const initializeThreeJS = (blob) => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, clearColor: 0xaaaaaa });

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    }

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0, 0);
    controls.update();

    const loader = new OBJLoader();
    loader.load(
      URL.createObjectURL(blob),
      (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / 2 * Math.tan(fov * 2));
        cameraZ *= 3.5;

        camera.position.set(cameraZ, cameraZ, cameraZ);

        object.traverse((child) => {
           if (child instanceof THREE.Mesh) {
               child.material = new THREE.MeshStandardMaterial();
           }
        });

        scene.add(object);
        camera.lookAt(center);
        setRenderedObject(object); // Store the object for downloading
      },
      (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
      },
      (error) => {
        console.error('An error happened during loading:', error);
      }
    );

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    scene.add(pointLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(hemisphereLight);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    animate();
  };

  const render3DObject = async () => {
    const formData = new FormData();
    formData.append('text_prompt', textPrompt);
    if (imageFile) {
      formData.append('uploaded_image_file', imageFile);
    }

    try {
      const response = await axios.post('http://192.168.1.194:8000/render/obj', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
      });

      initializeThreeJS(response.data);

    } catch (error) {
      if (error.response && error.response.data instanceof Blob) {
        error.response.data.text().then(text => {
          console.error('Error rendering 3D object:', text);
        });
      } else {
        console.error('Error rendering 3D object:', error.message);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (containerRef.current) {
        while (containerRef.current.firstChild) {
          containerRef.current.removeChild(containerRef.current.lastChild);
        }
      }
    };
  }, []);

return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} ref={backgroundRef}>
        <div className="flex flex-col items-center min-h-screen p-6 relative z-10">
            <h1 className="text-6xl font-extrabold mb-6 text-[rgba(207,180,60,1)]">3D OBJ Rendering</h1>
            <div className="flex flex-col items-start mb-4">
                <label className="mb-2 font-extrabold text-xl text-[rgba(207,180,60,1)]">OBJ Text Input:</label>
                <input type="text" value={textPrompt} onChange={handleTextInputChange} className="p-2 bg-white rounded shadow" />
            </div>
            <div className="flex flex-col items-start mb-4">
                <label className="mb-2 font-extrabold text-xl text-[rgba(207,180,60,1)]">OBJ Image Input:</label>
                <input type="file" onChange={handleFileInputChange} className="p-2 bg-white rounded shadow" />
            </div>
            <div className="flex space-x-4">
                <button className="p-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600" onClick={render3DObject}>Enter the rabbit hole..</button>
                <button className="p-2 bg-green-500 text-white rounded shadow hover:bg-green-600" onClick={downloadObjectAsObj}>Download OBJ</button>
            </div>
            <div ref={containerRef} style={{ width: '900px', height: '700px', marginTop: '24px' }} className="rounded shadow bg-white"></div>
        </div>
    </motion.div>
);
};

export default Render3D;




