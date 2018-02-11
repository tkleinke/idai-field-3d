import * as THREE from 'three';


/**
 * @author Thomas Kleinke
 */
export class Viewer3D {

    private renderer: THREE.WebGLRenderer;
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;


    constructor(private containerElement: HTMLElement) {

        this.initialize();
        this.resize();
        this.animate();
    }


    public destroy() {

        this.renderer.dispose();
        delete this.renderer;
    }


    public getRenderer(): THREE.WebGLRenderer {

        return this.renderer;
    }


    public getScene(): THREE.Scene {

        return this.scene;
    }


    public getCamera(): THREE.PerspectiveCamera {

        return this.camera;
    }


    public add(scene: THREE.Scene|THREE.Mesh) {

        this.scene.add(scene);
    }


    public remove(scene: THREE.Scene|THREE.Mesh) {

        this.scene.remove(scene);
    }


    public removeAll() {

        this.scene.children.filter(child => child instanceof THREE.Scene || child instanceof THREE.Mesh)
            .forEach(child => this.scene.remove(child));
    }


    private initialize() {

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.containerElement.appendChild(this.renderer.domElement);

        this.addLight();

        this.camera = this.createCamera();
    }


    private addLight() {

        this.scene.add(new THREE.HemisphereLight(0xf9edd9, 0x000000, 1));
    }


    private createCamera(): THREE.PerspectiveCamera {

        const camera = new THREE.PerspectiveCamera(75,
            this.containerElement.clientWidth / this.containerElement.clientHeight, 0.1, 1000);

        camera.position.set(0, 3, 0);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        return camera;
    }


    private animate() {

        if (!this.renderer) return;

        this.resize();

        requestAnimationFrame(this.animate.bind(this));

        this.renderer.render(this.scene, this.camera);
    }


    private resize() {

        const rendererElement: HTMLElement = this.renderer.domElement;

        const width: number = this.containerElement.clientWidth;
        const height: number = this.containerElement.clientHeight;

        if (rendererElement.clientWidth !== width || rendererElement.clientHeight !== height) {
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }
    }
}