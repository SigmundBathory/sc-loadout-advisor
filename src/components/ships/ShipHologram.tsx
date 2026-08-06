"use client";

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { useThemeTokens } from "@/components/providers/ThemeProvider";
import { type Ship } from "@/lib/types";

interface ShipHologramProps {
  ship: Ship;
  className?: string;
  size?: number; // Size of the container in pixels
}

export default function ShipHologram({ ship, className = "", size = 300 }: ShipHologramProps) {
  const { colors } = useThemeTokens();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17); // Deep space background from theme

    // Create camera
    const camera = new THREE.PerspectiveCamera(45, size / size, 0.1, 1000);
    camera.position.z = 5;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit for performance
    container.appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    // Add directional light for highlights
    const directionalLight = new THREE.DirectionalLight(0x00d4ff, 0.8); // Quantum blue
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Add a second directional light for fill
    const fillLight = new THREE.DirectionalLight(0xff6b00, 0.4); // Engine orange
    fillLight.position.set(-5, -5, -5);
    scene.add(fillLight);

    // Create ship representation based on classification
    const createShipGeometry = (classification: string) => {
      const cls = classification.toLowerCase();
      
      // Different geometries based on ship classification
      if (cls.includes("fighter") || cls.includes("combat") || cls.includes("interceptor")) {
        // Fighter - sharp, angular shape
        const geometry = new THREE.TetrahedronGeometry(2, 0);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          emissive: new THREE.Color(colors.quantum[500]),
          emissiveIntensity: 0.3,
          shininess: 50,
          specular: new THREE.Color(colors.semantic.text.primary),
          flatShading: true
        });
        return new THREE.Mesh(geometry, material);
      } else if (cls.includes("freight") || cls.includes("cargo") || cls.includes("transport")) {
        // Freighter - boxy shape
        const geometry = new THREE.BoxGeometry(3, 1.5, 2);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          emissive: new THREE.Color(colors.engine[500]),
          emissiveIntensity: 0.2,
          shininess: 30,
          specular: new THREE.Color(colors.semantic.text.primary)
        });
        return new THREE.Mesh(geometry, material);
      } else if (cls.includes("exploration") || cls.includes("expedition")) {
        // Explorer - elongated shape
        const geometry = new THREE.CylinderGeometry(0.8, 0.8, 3, 8);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          emissive: new THREE.Color(colors.semantic.status.info),
          emissiveIntensity: 0.25,
          shininess: 40
        });
        return new THREE.Mesh(geometry, material);
      } else if (cls.includes("stealth") || cls.includes("recon")) {
        // Stealth - faceted, angular
        const geometry = new THREE.OctahedronGeometry(1.8, 0);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          emissive: new THREE.Color(colors.semantic.status.warning),
          emissiveIntensity: 0.2,
          shininess: 60,
          flatShading: true
        });
        return new THREE.Mesh(geometry, material);
      } else if (cls.includes("mining") || cls.includes("salvage")) {
        // Mining/Industrial - rugged, uneven
        const geometry = new THREE.IcosahedronGeometry(1.7, 0);
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          emissive: new THREE.Color(colors.semantic.status.danger),
          emissiveIntensity: 0.15,
          shininess: 25
        });
        return new THREE.Mesh(geometry, material);
      } else {
        // Default - sphere with ring (generic ship)
        const group = new THREE.Group();
        
        // Main hull
        const sphereGeometry = new THREE.SphereGeometry(1.5, 16, 12);
        const sphereMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          emissive: new THREE.Color(colors.quantum[400]),
          emissiveIntensity: 0.2,
          shininess: 40
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        group.add(sphere);
        
        // Ring around ship
        const ringGeometry = new THREE.RingGeometry(1.6, 2.2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(colors.semantic.border.primary),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);
        
        return group;
      }
    };

    // Create ship model
    const shipModel = createShipGeometry(ship.classification || "Unknown");
    scene.add(shipModel);

    // Add holographic effect - outline/pulse
    const createHologramOutline = (mesh: THREE.Mesh) => {
      if (!mesh.geometry) return null;
      
      const outlineGeometry = mesh.geometry.clone();
      const outlineMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors.quantum[500]),
        side: THREE.BackSide,
      });
      
      const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
      outlineMesh.scale.multiplyScalar(1.05);
      return outlineMesh;
    };

    const outline = createHologramOutline(shipModel as THREE.Mesh);
    if (outline) {
      shipModel.add(outline);
    }

    // Add gentle rotation and pulse animation
    const clock = new THREE.Clock();
    
    const animate = () => {
      requestAnimationFrame(animate);
      
      const elapsedTime = clock.getElapsedTime();
      
      // Slow rotation
      shipModel.rotation.y = elapsedTime * 0.2;
      shipModel.rotation.x = Math.sin(elapsedTime * 0.1) * 0.2;
      
      // Pulse effect on emissive intensity
      if (shipModel instanceof THREE.Mesh && shipModel.material) {
        const pulse = Math.sin(elapsedTime * 1.5) * 0.2 + 0.8;
        if ('emissiveIntensity' in shipModel.material) {
          const material = shipModel.material as THREE.MeshPhongMaterial;
          material.emissiveIntensity = pulse * 0.3;
        }
      }
      
      // Pulse outline if exists
      if (outline && outline.material) {
        const outlinePulse = Math.sin(elapsedTime * 1.2) * 0.3 + 0.7;
        outline.material.opacity = outlinePulse * 0.4;
      }
      
      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      const width = container.clientWidth || size;
      const height = container.clientHeight || size;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener("resize", handleResize);
    
    setIsInitialized(true);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      
      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose();
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      renderer.dispose();
      container.innerHTML = "";
    };
  }, [ship, size, colors]);

  if (!isInitialized) {
    return (
      <div
        ref={containerRef}
        className={`
          relative w-[${size}px] h-[${size}px] rounded-xl 
          bg-muted/20 border border-border/30 
          flex items-center justify-center
          ${className}
        `}
      >
        <div className="text-muted-foreground text-xs animate-pulse">
          Cargando holograma...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`
        relative w-[${size}px] h-[${size}px] rounded-xl 
        bg-muted/10 border border-border/30 
        hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40
        transition-all duration-300
        ${className}
      `}
    />
  );
}