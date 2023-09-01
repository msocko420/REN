import React, { useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { UserContext } from "../components/UserContext";
import {
  headContainerAnimation,
  headContentAnimation,
  headTextAnimation,
  slideAnimation
} from '../config/motion';

const Home = () => {
  const { isAuthenticated } = useContext(UserContext);
  const [intro, setIntro] = useState(true);
  
  const homeRef = useRef(null); // Create a reference to the element you want the background effect applied to
  let vantaEffect = null; // Store the Vanta effect here

  useEffect(() => {
    // Ensure the scripts are loaded. If you're using a module bundler like Webpack, you'd typically import them instead.
    if (!window.VANTA) {
      return;
    }

    // Initialize VANTA
    vantaEffect = window.VANTA.CLOUDS2({
      el: homeRef.current,
      mouseControls: true,
      touchControls: true,
      gyroControls: false,
      minHeight: 200.00,
      minWidth: 200.00,
      scale: 1.00,
      backgroundColor: 0x708c42,
      skyColor: 0xc59242,
      cloudColor: 0xf3c66,
      lightColor: 0xa28484,
      speed: 0.70,
      texturePath: "/noise.png"
    });

    // Cleanup effect on component unmount
    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    }
  }, []); // The empty array means this useEffect will run once when the component mounts and cleanup when it unmounts

  return (
    <div className="scrollable-div" ref={homeRef}> 
      <a href="https://cubee3d.com/store/KashMunkey%20Creative%20LLC" target="_blank" rel="noreferrer" className="top-right-img">
      <img src="/cubee.jpg" alt="Cubee 3D" />
      <span>Click here to have your 3D Creation Printed instantly with Cubee3D</span>
    </a>
      {isAuthenticated ? (
        <AnimatePresence>
          {intro && (
            <motion.section className="home" {...slideAnimation('left')}>
              <motion.header {...slideAnimation("down")}>
                <div className="social-icons">
                  <a href="https://www.tiktok.com/@kashmunkey" target="_blank" rel="noreferrer">
                    <img src="/tiktok.jpg" alt="TikTok" />
                  </a>
                  <a href="https://www.youtube.com/channel/UCc7TfB4X5k3Mj6If96Qi9Rg" target="_blank" rel="noreferrer">
                    <img src="/youtube.png" alt="YouTube" />
                  </a>
                  <a href="https://www.facebook.com/KashMunkey" target="_blank" rel="noreferrer">
                    <img src="/facebook.png" alt="Facebook" />
                  </a>
                  <a href="https://instagram.com/kashmunkeycreative?igshid=OGQ5ZDc2ODk2ZA==" target="_blank" rel="noreferrer">
                    <img src="/insta.jpg" alt="Instagram" />
                  </a>
                </div>
                <div className="logo-container">
                  <Link to="../pages/account">
                    <img src='/threejs.png' alt="logo" className="w-10 h-10 object-contain" />
                  </Link>
                </div>
                </motion.header>
                <motion.div className="home-content" {...headContainerAnimation}>
                <motion.div {...headTextAnimation}>
                  <h1 className="head-text">REN3</h1>
                </motion.div>
                <motion.div {...headContentAnimation} className="flex flex-col gap-5">
                  <p className="max-w-md font-normal text-base" style={{ color: 'rgba(235, 189, 88, 0.527)' }}>
                    Welcome to the REN3 Platform, A growing platform for you to journey into <strong>Cutting Edge</strong> Generative AI Tools. We have intentions of being the "ONE-STOP-SHOP" for 3D Generation and Design.
                  </p>
                  <Link to="/render3d">
                    <button className="ren3-button" onClick={() => setIntro(false)}>RENDY-1</button>
                  </Link>
                  <p className="max-w-md font-normal text-base" style={{ color: 'rgba(235, 189, 88, 0.527)' }}>
                    While we develop our Generative 3D Platform to include an array of tools for 3D printers and designers alike, feel free to play around with <strong>RENDY-1</strong> which is backed by AI. More features and tools to come! Brought to you By Kash Munkey Creative. Follow us on one of our many social media platforms to stay up to date on our recent developments and consistent STEM based content.
                  </p>
                </motion.div>
              
              </motion.div>
            </motion.section>
          )}
        </AnimatePresence>
      ) : (
        <div>
          <p>Please <Link to="/login">login</Link> or <Link to="/signup">signup</Link> to access the content.</p>
        </div>
      )}
    </div>
  );
}

export default Home;
