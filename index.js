const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors')
const http = require('http');
const server = http.createServer(app);
const {Server} = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: '*'
    }
});

const uploadsDir = './uploads/';
const series = [];
let seriesFolderCounter = 0;
let seriesFileCounter = 0;

fs.readdirSync(uploadsDir).forEach(folder => {
    const seriesEntry = {
        id: `${seriesFolderCounter++}`,
        name: `${folder}`,
        files: []
    }
    const folderPath = path.join(uploadsDir, folder);
    fs.readdirSync(folderPath).forEach(file => {
        const filePath = path.join(folderPath, file);
        if (file === 'name.txt') {
            seriesEntry.name = fs.readFileSync(filePath).toString()
        } else {
            const name = path.parse(file).name;
            seriesEntry.files.push({
                id: seriesFileCounter++,
                name,
                number: Number(name),
                path: filePath.replace(/\\/g, '/')
            });
        }
    });
    seriesEntry.files.sort((a, b) => a.number - b.number);
    series.push(seriesEntry)
});

console.log(JSON.stringify(series, null, 1));
console.log(`Loaded ${seriesFolderCounter} series and ${seriesFileCounter} files`);

app.use(cors())
app.use('/uploads', express.static('uploads'))
app.use('/', express.static('frontend\\build'))

app.get('/series', (req, res) => {
    res.json({
        series
    });
});

const rooms = {};

function removeUser(socket) {
    const room = rooms[socket.roomId];
    if (!room) {
        return;
    }
    const index = room.users.findIndex((user) => user.userId === socket.userId);
    if (index < 0) {
        return;
    }
    room.users.splice(index, 1);
    if (room.users.length === 0) {
        delete rooms[socket.roomId];
        console.log(`Destroyed room ${socket.roomId}`);
    }
    socket.leave(socket.roomId);
    socket.to(socket.roomId).emit('user:leave', {
        userId: socket.userId
    });
    console.log(`User ${socket.userId} left room ${socket.roomId}`);
}

io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);

    let curUser = {
        userId: "",
        time: 0,
        status: 'loading',
    }

    socket.on('user:join', ({userId, roomId, seriesId}) => {
        socket.roomId = roomId;
        socket.userId = userId;
        curUser.userId = userId;
        if (!rooms[roomId]) {
            console.log(seriesId);
            const localSeries = series.find((s) => s.id === seriesId);
            const firstId = localSeries.files[0].id;
            rooms[roomId] = {
                users: [curUser],
                series: localSeries,
                curEpisodeId: firstId,
            }
            console.log(`Created room ${roomId} for series ${seriesId}`);
        } else {
            rooms[roomId].users.push(curUser);
        }
        socket.to(socket.roomId).emit('user:join', {newUser: curUser});
        socket.join(roomId);
        console.log(`User ${userId} joined room ${roomId}`);
    });

    socket.on('room:state', () => {
        socket.emit('room:state', {
            users: rooms[socket.roomId].users,
            series: rooms[socket.roomId].series,
            episodeId: rooms[socket.roomId].curEpisodeId
        });
    })

    socket.on('series:setEpisode', ({episodeId}) => {
        rooms[socket.roomId].curEpisodeId = episodeId;
        console.log(`Changing episodeId to ${episodeId}`);
        io.to(socket.roomId).emit('series:setEpisode', {
            episodeId: rooms[socket.roomId].curEpisodeId
        });
    })

    socket.on('user:state', ({newState}) => {
        curUser.time = newState.time ?? curUser.time;
        curUser.status = newState.status ?? curUser.status;
        socket.to(socket.roomId).emit('user:state', newState);
    });

    socket.on('room:seek', ({time, play}) => {
        socket.to(socket.roomId).emit('room:seek', {time, play});
    });

    socket.on('user:leave', () => {
        removeUser(socket);
    });

    socket.on('disconnect', () => {
        removeUser(socket);
        console.log(`Socket ${socket.id} disconnected`);
    })
});

server.listen(2020, () => {
    console.log('listening on *:2020');
});