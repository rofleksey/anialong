import {useEffect, useRef, useState} from 'react'
import io from 'socket.io-client'
import {nanoid} from 'nanoid'
import {useLocalStorage, useBeforeUnload} from 'react-use';

export const useSocket = (seriesId, roomId) => {
    const [users, setUsers] = useState([])
    const [series, setSeries] = useState(null)
    const [remotePlaybackState, setRemotePlaybackState] = useState({
        episodeId: null,
        playing: false,
        time: 0,
    });
    const [myUserId] = useLocalStorage('userId', nanoid(8))
    const socketRef = useRef(null)

    function updateLocalState(newState) {
        setUsers((prevState) => prevState.map((user) => {
            if (user.userId === newState.userId) {
                return {
                    ...user,
                    time: newState.time,
                    status: newState.status,
                }
            }
            return user;
        }));
    }

    useEffect(() => {
        socketRef.current = io()

        socketRef.current.emit('user:join', {userId: myUserId, roomId, seriesId})
        socketRef.current.emit('room:state', {})
        socketRef.current.on('series:setEpisode', ({episodeId}) => {
            console.log(`Setting episodeId to ${episodeId}`);
            setRemotePlaybackState({
                episodeId,
                playing: false,
                time: 0,
            });
        });
        socketRef.current.on('room:state', ({users, series, episodeId}) => {
            setUsers(users);
            setSeries(series);
            console.log(users);
            // TODO: sync time on each new connection
            let syncTime = 0;
            const syncUser = users.find((user) => user.userId !== myUserId);
            if (syncUser) {
                syncTime = syncUser.time;
            }
            setRemotePlaybackState({
                episodeId,
                time: syncTime,
                playing: false,
            });
        });
        socketRef.current.on('room:seek', ({time, play}) => {
            console.log(`Got seek from remote: time=${time}, play=${play}`);
            setRemotePlaybackState((prevState) => ({
                ...prevState,
                playing: play,
                time,
            }));
        });
        socketRef.current.on('user:join', ({newUser}) => {
            if (newUser.userId === myUserId) {
                return
            }
            setRemotePlaybackState((prevState) => ({
                ...prevState,
                playing: false,
                time: null,
            }));
            setUsers((prevState) => ([...prevState, newUser]));
        });
        socketRef.current.on('user:leave', ({userId}) => {
            setRemotePlaybackState((prevState) => ({
                ...prevState,
                playing: false,
                time: null,
            }));
            setUsers((prevState) => prevState.filter((user) => user.userId !== userId));
        });
        socketRef.current.on('user:state', (newState) => {
            if (newState.userId === myUserId) {
                return;
            }
            updateLocalState(newState);
        });
        return () => {
            socketRef.current.disconnect()
        }
    }, [roomId, myUserId])

    useBeforeUnload(() => {
        socketRef.current.emit('user:leave', {});
    });

    function updateState(newState) {
        updateLocalState(newState);
        socketRef.current.emit('user:state', {newState});
    }

    function seekRemote(time, play) {
        socketRef.current.emit('room:seek', {time, play});
    }

    function changeEpisodeRemote(newEpisodeId) {
        socketRef.current.emit('series:setEpisode', {episodeId: newEpisodeId});
    }

    return [users, myUserId, series, remotePlaybackState, seekRemote, updateState, changeEpisodeRemote]
}