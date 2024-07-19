let scene, camera, renderer;
let containers = [];
let boxes = [];
let controls = {
    containerWidth: 100,
    containerHeight: 100,
    containerDepth: 100
};

init();
animate();

function init() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 200;
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Create initial container and boxes
    createContainer();
    createBoxes();

    // Event listeners
    document.getElementById('updateContainer').addEventListener('click', updateContainer);
    //document.getElementById('rearrange').addEventListener('click', rearrangeBoxes);
    document.getElementById('addBox').addEventListener('click', addBox);
    
    // Mouse controls for rotating the scene
    let isDragging = false;
    let previousMousePosition = {
        x: 0,
        y: 0
    };

    renderer.domElement.addEventListener('mousedown', function(e) {
        isDragging = true;
    });

    renderer.domElement.addEventListener('mousemove', function(e) {
        let deltaMove = {
            x: e.offsetX - previousMousePosition.x,
            y: e.offsetY - previousMousePosition.y
        };

        if (isDragging) {
            let deltaRotationQuaternion = new THREE.Quaternion()
                .setFromEuler(new THREE.Euler(
                    toRadians(deltaMove.y * 1),
                    toRadians(deltaMove.x * 1),
                    0,
                    'XYZ'
                ));

            scene.quaternion.multiplyQuaternions(deltaRotationQuaternion, scene.quaternion);
        }

        previousMousePosition = {
            x: e.offsetX,
            y: e.offsetY
        };
    });

    document.addEventListener('mouseup', function(e) {
        isDragging = false;
    });
}

function toRadians(angle) {
    return angle * (Math.PI / 180);
}

function createContainer() {
    let geometry = new THREE.BoxGeometry(controls.containerWidth, controls.containerHeight, controls.containerDepth);
    let material = new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true });
    let container = new THREE.Mesh(geometry, material);
    containers.push(container);
    scene.add(container);
}

function createBoxes() {
    let boxSizes = [
        { width: 50, height: 50, depth: 50 },
        { width: 30, height: 30, depth: 30 }
    ];

    boxSizes.forEach(size => {
        for (let i = 0; i < 1; i++) {
            let geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
            let color = Math.random() * 0xffffff;
            let material = new THREE.MeshBasicMaterial({ color: color });
            let box = new THREE.Mesh(geometry, material);
            boxes.push(box);
        }
    });

    placeBoxes();
}

function addBox() {
    let width = parseFloat(document.getElementById('boxWidth').value);
    let height = parseFloat(document.getElementById('boxHeight').value);
    let depth = parseFloat(document.getElementById('boxDepth').value);
    
    let geometry = new THREE.BoxGeometry(width, height, depth);
    let color = Math.random() * 0xffffff;
    let material = new THREE.MeshBasicMaterial({ color: color });
    let box = new THREE.Mesh(geometry, material);
    boxes.push(box);
    
    placeBoxes();
}

function updateContainer() {
    controls.containerWidth = parseFloat(document.getElementById('containerWidth').value);
    controls.containerHeight = parseFloat(document.getElementById('containerHeight').value);
    controls.containerDepth = parseFloat(document.getElementById('containerDepth').value);
    
    containers.forEach(container => scene.remove(container));
    containers = [];
    createContainer();
    placeBoxes();
}

function rearrangeBoxes() {
    placeBoxes();
}

function placeBoxes() {
    // Remove all boxes from the scene
    boxes.forEach(box => scene.remove(box));
    
    // Calculate total volume of all boxes
    let totalBoxVolume = boxes.reduce((acc, box) => acc + box.geometry.parameters.width * box.geometry.parameters.height * box.geometry.parameters.depth, 0);
    let containerVolume = controls.containerWidth * controls.containerHeight * controls.containerDepth;
    
    // Calculate the number of required containers
    let requiredContainers = Math.ceil(totalBoxVolume / containerVolume);

    // Remove existing containers
    containers.forEach(container => scene.remove(container));
    containers = [];

    // Create required number of containers
    for (let i = 0; i < requiredContainers; i++) {
        let container = new THREE.Mesh(
            new THREE.BoxGeometry(controls.containerWidth, controls.containerHeight, controls.containerDepth),
            new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true })
        );
        container.position.set((i - Math.floor(requiredContainers / 2)) * (controls.containerWidth + 10), 0, 0);
        containers.push(container);
        scene.add(container);
    }

    // Place boxes in the containers using bin-packing heuristic
    boxes.sort((a, b) => b.geometry.parameters.width * b.geometry.parameters.height * b.geometry.parameters.depth - a.geometry.parameters.width * a.geometry.parameters.height * a.geometry.parameters.depth);

    let containerIndex = 0;
    let positions = [];

    boxes.forEach(box => {
        let placed = false;
        while (!placed && containerIndex < containers.length) {
            let container = containers[containerIndex];
            for (let x = -controls.containerWidth / 2; x <= controls.containerWidth / 2 - box.geometry.parameters.width; x += 1) {
                for (let y = -controls.containerHeight / 2; y <= controls.containerHeight / 2 - box.geometry.parameters.height; y += 1) {
                    for (let z = -controls.containerDepth / 2; z <= controls.containerDepth / 2 - box.geometry.parameters.depth; z += 1) {
                        if (!positions.some(pos => 
                            pos.containerIndex === containerIndex &&
                            x < pos.x + pos.width && x + box.geometry.parameters.width > pos.x &&
                            y < pos.y + pos.height && y + box.geometry.parameters.height > pos.y &&
                            z < pos.z + pos.depth && z + box.geometry.parameters.depth > pos.z)) {
                            box.position.set(
                                container.position.x + x + box.geometry.parameters.width / 2, 
                                y + box.geometry.parameters.height / 2, 
                                z + box.geometry.parameters.depth / 2
                            );
                            scene.add(box);
                            positions.push({ x, y, z, width: box.geometry.parameters.width, height: box.geometry.parameters.height, depth: box.geometry.parameters.depth, containerIndex });
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
                if (placed) break;
            }
            if (!placed) containerIndex++;
        }
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
