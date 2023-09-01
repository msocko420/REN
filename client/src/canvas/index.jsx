import { useSnapshot } from 'valtio';
import state from '../store';
import { Canvas } from '@react-three/fiber';
import { Environment, Center } from '@react-three/drei';

import Shirt from './Shirt';
import Backdrop from './Backdrop';
import CameraRig from './CameraRig';

const CanvasModel = () => {
  const snapshot = useSnapshot(state); // Replace 'yourState' with the actual state variable name
  
  return (
    <Canvas
      shadows
      camera={{ position: [0, 0, 0], fov: 25 }}
      gl={{ preserveDrawingBuffer: true }}
      className="w-full max-w-full h-full transition-all ease-in"
    >
      <ambientLight intensity={0.5} />

      <CameraRig>
        <Backdrop />
        <Center>
          { !snapshot.intro && <Shirt /> } {/* Render Shirt only when state.intro is false */}
        </Center>
      </CameraRig>
    </Canvas>
  );
};

export default CanvasModel;
