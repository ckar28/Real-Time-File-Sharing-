(function(){

	const socket = io();
	let sender_uid;

	// Function to generate a unique room ID
	function generateID(){
		return `${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}-${Math.trunc(Math.random()*999)}`;
	}

	// Event listener for "receiver-start-con-btn" click
	document.querySelector("#receiver-start-con-btn").addEventListener("click",function(){
		// Get the sender's room ID from the input field
		sender_uid = document.querySelector("#join-id").value;
		if(sender_uid.length == 0){
			return;
		}
		// Generate a room ID for the receiver
		let joinID = generateID();
		 // Emit "receiver-join" event to the server with sender's and receiver's room IDs
		socket.emit("receiver-join", {
			sender_uid:sender_uid,
			uid:joinID
		});
		// Switch to the file sharing screen
		document.querySelector(".join-screen").classList.remove("active");
		document.querySelector(".fs-screen").classList.add("active");
	});
	// Initialize an object to store file sharing data
	let fileShare = {};

	socket.on("fs-meta",function(metadata){
		  // Initialize the fileShare object with metadata
		fileShare.metadata = metadata;
		fileShare.transmitted = 0;
		fileShare.buffer = [];

		// Create a UI element for the shared file
		let el = document.createElement("div");
		el.classList.add("item");
		el.innerHTML = `
				<div class="progress">0%</div>
				<div class="filename">${metadata.filename}</div>
		`;
		document.querySelector(".files-list").appendChild(el);

		// Store the progress node in the fileShare object
		fileShare.progrss_node = el.querySelector(".progress");
		
		// Emit "fs-start" event to signal the server to start sending file data
		socket.emit("fs-start",{
			uid:sender_uid
		});
	});
	// Event listener for "fs-share" events from the server
	socket.on("fs-share",function(buffer){
		// Accumulate data chunks and update progress
		console.log("Buffer", buffer);
		fileShare.buffer.push(buffer);
		fileShare.transmitted += buffer.byteLength;
		fileShare.progrss_node.innerText = Math.trunc(fileShare.transmitted / fileShare.metadata.total_buffer_size * 100);
		
		 // If the entire file has been received, trigger download
		if(fileShare.transmitted == fileShare.metadata.total_buffer_size){
			console.log("Download file: ", fileShare);
			download(new Blob(fileShare.buffer), fileShare.metadata.filename);
			fileShare = {}; // Reset fileShare object for future transfers
		} else {
			// If there's more data to receive, emit "fs-start" event
			socket.emit("fs-start",{
				uid:sender_uid
			});
		}
	});

})();