/**
 * AWAKE — estudio de iluminación compartido para la moneda 3D.
 *
 * Entorno HDRI procedural (PMREM) con softboxes. Parametrizable desde coin.html
 * para equilibrar reflejos frontales sin lavar el relieve.
 *
 *   import { makeStudioEnv } from './coin-studio.js';
 *   scene.environment = makeStudioEnv(renderer, { frontBoost: 0.65 });
 */
import * as THREE from '../vendor/three.module.min.js';

/**
 * @param {THREE.WebGLRenderer} renderer
 * @param {object} [opts]
 * @param {number} [opts.frontBoost=0.65] multiplicador paños ±Z (1 = legacy)
 * @param {number} [opts.sideBoost=1.0] multiplicador paños laterales oblicuos
 * @param {number} [opts.ceilingBoost=1.0] tira de techo
 * @param {number} [opts.floorBoost=1.25] rebote inferior oscuro
 */
export function makeStudioEnv(renderer, opts) {
    opts = opts || {};
    const front = opts.frontBoost != null ? opts.frontBoost : 0.65;
    const side = opts.sideBoost != null ? opts.sideBoost : 1.0;
    const ceiling = opts.ceilingBoost != null ? opts.ceilingBoost : 1.0;
    const floor = opts.floorBoost != null ? opts.floorBoost : 1.25;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x0d0f14);

    const room = new THREE.Mesh(
        new THREE.BoxGeometry(30, 20, 30),
        new THREE.MeshStandardMaterial({ side: THREE.BackSide, color: 0xffffff })
    );
    envScene.add(room);

    const keyL = new THREE.PointLight(0xfff1dc, 280, 40, 2);
    keyL.position.set(8, 6, 8);
    envScene.add(keyL);
    const fillL = new THREE.PointLight(0xdbe6ff, 130, 40, 2);
    fillL.position.set(-8, 3, -6);
    envScene.add(fillL);

    const panel = (w, h, color, intensity, x, y, z) => {
        const m = new THREE.Mesh(
            new THREE.PlaneGeometry(w, h),
            new THREE.MeshLambertMaterial({
                color: 0x000000,
                emissive: new THREE.Color(color),
                emissiveIntensity: intensity,
                side: THREE.DoubleSide
            })
        );
        m.position.set(x, y, z);
        m.lookAt(0, 0, 0);
        envScene.add(m);
        return m;
    };

    // Clave y rellenos generales
    panel(9, 5.5, 0xfff1dd, 5.0, 4.2, 3.0, 4.2);
    panel(8, 6, 0xffffff, 3.0 * side, -4.5, 1.5, -4.5);
    panel(7, 5, 0xdce7ff, 2.2 * side, -5.0, 3.5, 2.5);
    panel(12, 2.2, 0xffffff, 2.5 * ceiling, 0, 6.5, 0);
    panel(8, 3, 0x404752, 1.5 * floor, 0, -5.0, 0);
    panel(5, 4, 0xfff1dd, 1.2, 0, 1.5, -6.5);

    // Paños oblicuos (evitan muro frontal plano → menos hotspot de frente)
    panel(7, 5.5, 0xfff1dd, 2.4 * side, 5.5, 2.0, 3.8);
    panel(7, 5.5, 0xfff1dd, 2.4 * side, -5.5, 2.0, 3.8);
    panel(7, 5.5, 0xfff1dd, 2.4 * side, 5.5, 2.0, -3.8);
    panel(7, 5.5, 0xfff1dd, 2.4 * side, -5.5, 2.0, -3.8);

    // Equilibrio ±Z — intensidad reducida por defecto (frontBoost < 1)
    panel(9, 6, 0xfff1dd, 3.4 * front, 4.5, 1.2, 4.5);
    panel(6, 5, 0xf3f6ff, 1.8 * front, 0, 1.2, 6.5);
    panel(10, 6, 0xfff1dd, 2.2 * front, 0, -5.4, 2.2);
    panel(9, 5, 0xfff1dd, 1.8 * front, -3.8, -5.0, 3.2);

    panel(9, 6, 0xfff1dd, 3.4 * front, 4.5, 1.2, -4.5);
    panel(6, 5, 0xf3f6ff, 1.8 * front, 0, 1.2, -6.5);
    panel(10, 6, 0xfff1dd, 2.2 * front, 0, -5.4, -2.2);
    panel(9, 5, 0xfff1dd, 1.8 * front, -3.8, -5.0, -3.2);

    const tex = pmrem.fromScene(envScene, 0.04).texture;
    envScene.traverse(o => {
        if (o.isMesh) {
            o.material.dispose();
            o.geometry.dispose();
        }
    });
    pmrem.dispose();
    return tex;
}
