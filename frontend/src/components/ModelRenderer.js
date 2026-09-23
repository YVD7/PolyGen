"use client";

import React, { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

export default function ModelRenderer({
  modelUrl,
  shadingMode = "pbr",
  materialSettings = { roughness: 0.5, metalness: 0.5, emissiveIntensity: 2.0 },
  autoRotate = false,
  rotationSpeed = 0.5,
}) {
  const groupRef = useRef();
  const [modelScene, setModelScene] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Load GLTF / GLB model
  useEffect(() => {
    if (!modelUrl) return;

    setLoading(true);
    setLoadError(null);
    const loader = new GLTFLoader();

    loader.load(
      modelUrl,
      (gltf) => {
        const scene = gltf.scene;

        // Compute bounding box to normalize scale and center model
        const box = new THREE.Box3().setFromObject(scene);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.4 / (maxDim || 1);

        // Center precisely at y = 0.35
        scene.position.x = -center.x * scale;
        scene.position.y = -center.y * scale + 0.35;
        scene.position.z = -center.z * scale;
        scene.scale.set(scale, scale, scale);

        // Enable shadows and enhance materials for visibility
        scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Clone and store original material
            if (!child.userData.origMaterial) {
              const orig = child.material ? child.material.clone() : new THREE.MeshStandardMaterial();
              child.userData.origMaterial = orig;
            }
          }
        });

        setModelScene(scene);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error("Error loading GLTF:", err);
        setLoadError("Failed to load 3D model asset");
        setLoading(false);
      }
    );
  }, [modelUrl]);

  // Apply shading modes and material parameter tweaks
  useEffect(() => {
    if (!modelScene) return;

    modelScene.traverse((child) => {
      if (!child.isMesh) return;

      const orig = child.userData.origMaterial;

      if (shadingMode === "wireframe") {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x00f2fe,
          wireframe: true,
          wireframeLinewidth: 1.2,
        });
      } else if (shadingMode === "normals") {
        child.material = new THREE.MeshNormalMaterial({
          flatShading: false,
        });
      } else if (shadingMode === "clay") {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xe2e8f0,
          roughness: 0.8,
          metalness: 0.05,
          flatShading: false,
        });
      } else {
        // Full PBR mode
        const mat = orig ? orig.clone() : new THREE.MeshStandardMaterial();
        mat.wireframe = false;

        // Apply live slider overrides
        if (typeof materialSettings.roughness === "number") {
          mat.roughness = THREE.MathUtils.clamp(materialSettings.roughness, 0.05, 1.0);
        }
        if (typeof materialSettings.metalness === "number") {
          // Keep metalness capped below 0.82 to avoid 100% black reflection when no HDR is loaded
          mat.metalness = THREE.MathUtils.clamp(materialSettings.metalness, 0.0, 0.8);
        }

        // Emissive intensity boost (e.g. glowing blue sapphire)
        if (mat.emissive) {
          const intensity = materialSettings.emissiveIntensity ?? 2.0;
          mat.emissiveIntensity = intensity;
          // If material is the hero gem or emissive is zero, ensure sapphire glow
          if (mat.emissive.r === 0 && mat.emissive.g === 0 && mat.emissive.b === 0 && intensity > 1.5) {
            mat.emissive = new THREE.Color(0x00a8ff);
            mat.emissiveIntensity = intensity * 0.4;
          }
        }

        child.material = mat;
      }
    });
  }, [modelScene, shadingMode, materialSettings]);

  // Turntable animation
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={groupRef}>
      {modelScene && <primitive object={modelScene} />}
    </group>
  );
}
