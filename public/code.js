(function(){

	let receiverID;
	const socket = io();
	// Generate a unique room ID
	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}
	// Event listener for "sender-start-con-btn" click
	document.querySelector("#sender-start-con-btn").addEventListener("click",function(){
		 // Generate a room ID and display it
		let joinID = generateID();
		document.querySelector("#join-id").innerHTML = `
			<b>Room ID</b>
			<span>${joinID}</span>
		`;
		// Emit "sender-join" event to the server with the generated room ID
		socket.emit("sender-join", {
			uid:joinID
		});
	});

	socket.on("init",function(uid){
		receiverID = uid;
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});


    // Event listener for file input change
	document.querySelector("#file-input").addEventListener("change",function(e){
		let file = e.target.files[0];
		if(!file){
			return;		
		}
		// Read file content as an ArrayBuffer
		let reader = new FileReader();
		reader.onload = function(e){
			let buffer = new Uint8Array(reader.result);
			// Create a UI element for the file
			let el = document.createElement("div");
			el.classList.add("item");
			el.innerHTML = `
					<div class="progress">0%</div>
					<div class="filename">${file.name}</div>
			`;
			document.querySelector(".files-list").appendChild(el);
			// Share the file with progress tracking
			shareFile({
				filename: file.name,
				total_buffer_size:buffer.length,
				buffer_size:1024,
			}, buffer, el.querySelector(".progress"));
		}
		reader.readAsArrayBuffer(file);
	});

// Function to share a file
	function shareFile(metadata,buffer,progress_node){
		// Emit "file-meta" event with metadata to the server
		socket.emit("file-meta", {
			uid:receiverID,
			metadata:metadata
		});
		// Listen for "fs-share" events from the server
		socket.on("fs-share",function(){
			let chunk = buffer.slice(0,metadata.buffer_size);
			buffer = buffer.slice(metadata.buffer_size,buffer.length);
			progress_node.innerText = Math.trunc(((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100));
			// If there's more data to send, emit "file-raw" event
			if(chunk.length != 0){
				socket.emit("file-raw", {
					uid:receiverID,
					buffer:chunk
				});
			} else {
				console.log("Sent file successfully");
			}
		});
	}
})();