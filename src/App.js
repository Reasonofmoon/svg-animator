import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toPng } from 'html-to-image';
import gifshot from 'gifshot';

const AnimationPresets = {
  bounce: {
    y: [0, -10, 0],
    transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: { duration: 1, repeat: Infinity, ease: "easeInOut" }
  },
  spin: {
    rotate: [0, 360],
    transition: { duration: 2, repeat: Infinity, ease: "linear" }
  },
  shake: {
    x: [-5, 5, -5],
    transition: { duration: 0.5, repeat: Infinity }
  },
  fadeInOut: {
    opacity: [0, 1, 0],
    transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
  },
  slideIn: {
    x: [-50, 0],
    transition: { duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeOut" }
  },
  zoom: {
    scale: [0.5, 1],
    transition: { duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeOut" }
  },
  wobble: {
    rotate: [-5, 0, 5, 0],
    transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
  }
};

const SVGAnimator = () => {
  const [svgCode, setSvgCode] = useState('');
  const [selectedAnimation, setSelectedAnimation] = useState('bounce');
  const [animatedSVG, setAnimatedSVG] = useState('');
  const [customDuration, setCustomDuration] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [previewSize, setPreviewSize] = useState(200);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const svgRef = useRef(null);

  useEffect(() => {
    if (svgCode) {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgCode, 'image/svg+xml');
      const svgElement = svgDoc.documentElement;
      const viewBox = svgElement.getAttribute('viewBox') || '0 0 100 100';
      setAnimatedSVG(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
          ${svgElement.innerHTML}
        </svg>
      `);
    }
  }, [svgCode]);

  const getAnimationWithCustomDuration = () => {
    const baseAnimation = AnimationPresets[selectedAnimation];
    return {
      ...baseAnimation,
      transition: {
        ...baseAnimation.transition,
        duration: customDuration
      }
    };
  };

  const captureFrame = () => {
    return new Promise((resolve) => {
      if (svgRef.current) {
        setTimeout(() => {
          toPng(svgRef.current, { backgroundColor: backgroundColor })
            .then((dataUrl) => {
              resolve(dataUrl);
            })
            .catch((error) => {
              console.error('Error capturing frame:', error);
              resolve(null);
            });
        }, 100); // Add a small delay to ensure the animation is captured
      } else {
        resolve(null);
      }
    });
  };

  const createGif = async () => {
    setIsExporting(true);
    const frames = [];
    const frameCount = 30; // Adjust for smoother or faster GIF
    
    for (let i = 0; i < frameCount; i++) {
      const frame = await captureFrame();
      if (frame) frames.push(frame);
    }

    gifshot.createGIF(
      {
        images: frames,
        gifWidth: previewSize,
        gifHeight: previewSize,
        interval: customDuration / frameCount,
      },
      function (obj) {
        if (!obj.error) {
          const image = obj.image;
          const link = document.createElement('a');
          link.href = image;
          link.download = 'animated-svg.gif';
          link.click();
        }
        setIsExporting(false);
      }
    );
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gray-100 p-4 text-base">
      <h1 className="text-2xl font-bold mb-4 text-indigo-600">SVG Animator</h1>
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-4">
        <textarea
          className="w-full h-24 p-2 mb-3 border rounded text-sm focus:ring focus:ring-indigo-200"
          placeholder="Paste your SVG code here..."
          value={svgCode}
          onChange={(e) => setSvgCode(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Animation</label>
            <select
              className="w-full p-2 border rounded text-sm focus:ring focus:ring-indigo-200"
              value={selectedAnimation}
              onChange={(e) => setSelectedAnimation(e.target.value)}
            >
              {Object.keys(AnimationPresets).map((anim) => (
                <option key={anim} value={anim}>{anim}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Duration (s)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={customDuration}
              onChange={(e) => setCustomDuration(parseFloat(e.target.value))}
              className="w-full p-2 border rounded text-sm focus:ring focus:ring-indigo-200"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Preview Size (px)</label>
            <input
              type="number"
              min="50"
              max="300"
              step="10"
              value={previewSize}
              onChange={(e) => setPreviewSize(parseInt(e.target.value))}
              className="w-full p-2 border rounded text-sm focus:ring focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
            <input
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-full p-1 h-9 border rounded focus:ring focus:ring-indigo-200"
            />
          </div>
        </div>
        <AnimatePresence>
          {animatedSVG && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="border rounded p-2 bg-white mb-3 flex justify-center items-center"
              style={{ backgroundColor: backgroundColor, width: previewSize, height: previewSize, margin: '0 auto' }}
              ref={svgRef}
            >
              <motion.div
                dangerouslySetInnerHTML={{ __html: animatedSVG }}
                animate={getAnimationWithCustomDuration()}
                style={{ width: '100%', height: '100%' }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={createGif}
          disabled={isExporting || !animatedSVG}
          className="w-full p-3 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-200"
        >
          {isExporting ? 'Exporting...' : 'Export as GIF'}
        </button>
      </div>
    </div>
  );
};

export default SVGAnimator;