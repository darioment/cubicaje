function placeBoxes() {
    // Remove all boxes from the scene
    boxes.forEach(box => scene.remove(box));
    
    // Calculate total volume of all boxes
    let totalBoxVolume = boxes.reduce((acc, box) => acc + box.geometry.parameters.width * box.geometry.parameters.height * box.geometry.parameters.depth, 0);
    let containerVolume = controls.containerWidth * controls.containerHeight * controls.containerDepth;
    
    // Calculate the initial number of required containers
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
    let currentContainerVolume = 0;

    boxes.forEach(box => {
        let placed = false;
        while (!placed) {
            let container = containers[containerIndex];
            for (let x = -controls.containerWidth / 2; x <= controls.containerWidth / 2 - box.geometry.parameters.width; x++) {
                for (let y = -controls.containerHeight / 2; y <= controls.containerHeight / 2 - box.geometry.parameters.height; y++) {
                    for (let z = -controls.containerDepth / 2; z <= controls.containerDepth / 2 - box.geometry.parameters.depth; z++) {
                        if (!positions.some(pos =>
                            pos.containerIndex === containerIndex &&
                            x < pos.x + pos.width &&
                            x + box.geometry.parameters.width > pos.x &&
                            y < pos.y + pos.height &&
                            y + box.geometry.parameters.height > pos.y &&
                            z < pos.z + pos.depth &&
                            z + box.geometry.parameters.depth > pos.z
                        )) {
                            box.position.set(
                                x + box.geometry.parameters.width / 2,
                                y + box.geometry.parameters.height / 2,
                                z + box.geometry.parameters.depth / 2
                            );
                            container.add(box);
                            positions.push({
                                containerIndex: containerIndex,
                                x: x,
                                y: y,
                                z: z,
                                width: box.geometry.parameters.width,
                                height: box.geometry.parameters.height,
                                depth: box.geometry.parameters.depth
                            });
                            placed = true;
                            
                            // Update current container volume
                            currentContainerVolume += box.geometry.parameters.width * box.geometry.parameters.height * box.geometry.parameters.depth;
                            
                            // Check if container is 80% full
                            if (currentContainerVolume >= 0.8 * containerVolume) {
                                containerIndex++;
                                currentContainerVolume = 0;
                                
                                // Create a new container if needed
                                if (containerIndex >= containers.length) {
                                    let newContainer = new THREE.Mesh(
                                        new THREE.BoxGeometry(controls.containerWidth, controls.containerHeight, controls.containerDepth),
                                        new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true })
                                    );
                                    newContainer.position.set((containers.length - Math.floor(containers.length / 2)) * (controls.containerWidth + 10), 0, 0);
                                    containers.push(newContainer);
                                    scene.add(newContainer);
                                }
                            }
                            break;
                        }
                    }
                    if (placed) break;
                }
                if (placed) break;
            }
            if (!placed) {
                containerIndex++;
                currentContainerVolume = 0;
                
                // Create a new container if needed
                if (containerIndex >= containers.length) {
                    let newContainer = new THREE.Mesh(
                        new THREE.BoxGeometry(controls.containerWidth, controls.containerHeight, controls.containerDepth),
                        new THREE.MeshBasicMaterial({ color: 0x39ff14, wireframe: true })
                    );
                    newContainer.position.set((containers.length - Math.floor(containers.length / 2)) * (controls.containerWidth + 10), 0, 0);
                    containers.push(newContainer);
                    scene.add(newContainer);
                }
            }
        }
    });

    // Update container count and icons
    document.getElementById('containerCount').innerText = 'Contenedores creados: ' + containers.length;
    updateContainerIcons(containers.length);
}
