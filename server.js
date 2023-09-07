// Import necessary modules
const express = require("express");
const path = require("path");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

// Serve static files from the "public" directory
		app.use(express.static(path.join(__dirname + "/public")));

// Handle Socket.io connections
		io.on("connection", function (socket) {
		// Handle sender joining a room
		socket.on("sender-join", function (data) {
			socket.join(data.uid);
		});

		// Handle receiver joining a room
		socket.on("receiver-join", function (data) {
			socket.join(data.uid);
			socket.in(data.sender_uid).emit("init", data.uid);
		});

		// Handle sharing file metadata
		socket.on("file-meta", function (data) {
			socket.in(data.uid).emit("fs-meta", data.metadata);
		});

		// Handle file sharing start
		socket.on("fs-start", function (data) {
			socket.in(data.uid).emit("fs-share", {});
		});

		// Handle sharing raw file data
		socket.on("file-raw", function (data) {
			socket.in(data.uid).emit("fs-share", data.buffer);
		});
});

// Start the server and listen on port 5000
server.listen(5000);
