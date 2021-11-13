import './App.css';
import './Watch.css'
import React, {createRef, useEffect, useRef, useState} from "react";
import {useSocket} from "../hooks/useSocket";
import {useParams} from "react-router-dom";
import {clamp, throttle} from 'lodash';
import {useInterval} from "react-use";
import SquareAvatar from "../components/SquareAvatar";
import {faPause, faCheck, faPlay, faClock} from '@fortawesome/free-solid-svg-icons'
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import RoflexProgressBar from "../components/RoflexProgressBar";

function Watch() {
    const {seriesId, roomId} = useParams();
    const [users, myUserId, series, remotePlaybackState, seekRemote, updateState, changeEpisodeRemote] = useSocket(seriesId, roomId);
    const [remoteSrc, setRemoteSrc] = useState(null);
    const [blobSrc, setBlobSrc] = useState(null);
    const [information, setInformation] = useState({
        seriesName: '',
        episodeNumber: 0,
    });
    const [downloadStatus, setDownloadStatus] = useState({
        overlay: true,
        error: null,
        progress: 0,
    });
    const xmlRequestRef = useRef(null);
    const hideControlsTimer = useRef(null);
    const videoRef = useRef(null);
    const playerRef = useRef(null);
    const sliderRef = useRef(null);
    const volumeSliderRef = useRef(null);
    const [playerState, setPlayerState] = useState({
        curTimeStr: '0:00',
        totalTimeStr: '0:00',
        previewTimeStr: '0:00',
        totalDuration: 0,
        playing: false,
        showControls: true,
        volume: 1,
        progress: 0,
        previewLeft: 0,
    });

    // log seriesId and roomId once
    useEffect(() => {
        console.log("seriesId", seriesId);
        console.log("roomId", roomId);
    }, [roomId, seriesId]);

    // sync remote time and playing
    useEffect(() => {
        if (playerState.totalDuration === 0) {
            return;
        }
        console.log('Remote playback state changed', remotePlaybackState);
        if (remotePlaybackState.time !== null) {
            seekTo(remotePlaybackState.time, false, false);
            setPlayerState((prevState) => ({
                ...prevState,
                playing: remotePlaybackState.playing,
                progress: remotePlaybackState.time / playerState.totalDuration
            }));
        } else {
            setPlayerState((prevState) => ({
                ...prevState,
                playing: remotePlaybackState.playing,
            }));
        }
    }, [remotePlaybackState, playerState.totalDuration, remotePlaybackState.playing, remotePlaybackState.time]);

    function stopHideControlsTimer() {
        if (hideControlsTimer.current) {
            clearTimeout(hideControlsTimer.current);
        }
    }

    function restartHideControlsTimer() {
        if (!playerState.showControls) {
            setPlayerState((prevState) => ({
                ...prevState,
                showControls: true,
            }));
        }
        if (!playerState.playing) {
            return;
        }
        stopHideControlsTimer();
        hideControlsTimer.current = setTimeout(() => {
            setPlayerState((prevState) => ({
                ...prevState,
                showControls: false,
            }));
        }, 3000);
    }

    // toggle playback
    useEffect(() => {
        if (playerState.playing) {
            console.log('resuming playback');
            videoRef.current.play();
            restartHideControlsTimer()
        } else {
            console.log('pausing playback');
            videoRef.current.pause();
            stopHideControlsTimer();
        }
    }, [playerState.playing]);

    // set volume
    useEffect(() => {
        videoRef.current.volume = playerState.volume;
    }, [playerState.volume]);

    //track current time and send state
    useInterval(() => {
        if (!videoRef.current) {
            return;
        }
        setPlayerState((prevState) => ({
            ...prevState,
            curTimeStr: formatTime(videoRef.current.currentTime),
            progress: videoRef.current.currentTime / playerState.totalDuration,
        }));
        let status;
        if (downloadStatus.overlay) {
            status = 'loading';
        } else if (playerState.playing) {
            status = 'playing'
        } else {
            status = 'paused';
        }
        updateState({
            userId: myUserId,
            time: videoRef.current.currentTime,
            status,
        });
    }, 500);

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    // preload video
    useEffect(() => {
        if (remoteSrc === null || !videoRef.current) {
            return;
        }
        console.log("Starting preload");
        const request = new XMLHttpRequest();
        xmlRequestRef.current = request;
        request.open('GET', `/${remoteSrc}`, true);
        request.responseType = 'blob';
        request.onload = function () {
            if (this.status === 200) {
                setBlobSrc(URL.createObjectURL(this.response));
                setDownloadStatus(prevStatus => ({
                    ...prevStatus,
                    overlay: false,
                    progress: 1,
                }));
            } else {
                setDownloadStatus(prevStatus => ({
                    ...prevStatus,
                    progress: null,
                    error: 'Ошибка скачивания, перезагрузите страницу'
                }));
            }
        }
        request.onerror = () => {
            setDownloadStatus(prevStatus => ({
                ...prevStatus,
                progress: null,
                error: 'Ошибка скачивания, перезагрузите страницу'
            }));
        }
        request.onprogress = (event) => {
            setDownloadStatus(prevStatus => ({
                ...prevStatus,
                progress: event.loaded / event.total,
            }));
        }
        request.send();

        videoRef.current.addEventListener('loadeddata', () => {
            const duration = videoRef.current.duration;
            setPlayerState(prevState => ({
                ...prevState,
                totalDuration: duration,
                totalTimeStr: formatTime(duration),
            }));
        }, false);
    }, [remoteSrc]);

    // on fetch remote episode id
    useEffect(() => {
        if (remotePlaybackState.episodeId === null) {
            return;
        }
        console.log(`New episode id: ${remotePlaybackState.episodeId}`);
        const file = series.files.find((f) => f.id === remotePlaybackState.episodeId);
        console.log(file);
        console.log(`Loading ${file.path}...`);
        setInformation({
            seriesName: series.name,
            episodeNumber: file.number,
        });
        setRemoteSrc(file.path);
    }, [series, remotePlaybackState.episodeId]);

    function togglePlayback() {
        if (playerState.playing) {
            seekRemote(videoRef.current.currentTime, false);
        } else {
            seekRemote(videoRef.current.currentTime, true);
        }
        setPlayerState((prevState) => ({
            ...prevState,
            playing: !prevState.playing,
        }));
    }

    function movePreview(e) {
        const bounds = e.target.getBoundingClientRect();
        const maxDx = sliderRef.current.clientWidth;
        const dx = clamp(e.clientX - bounds.left, 0, maxDx);
        const previewTime = playerState.totalDuration * dx / maxDx;
        setPlayerState((prevState) => ({
            ...prevState,
            previewLeft: dx / maxDx,
            previewTimeStr: formatTime(previewTime),
        }));
        restartHideControlsTimer();
        return dx / maxDx;
    }

    const seekThrottle = throttle((newTime) => {
        videoRef.current.currentTime = newTime;
    }, 250);

    function seekTo(newTime, throttle, sendToRemote) {
        if (throttle) {
            seekThrottle(newTime);
        } else {
            videoRef.current.currentTime = newTime;
        }
        if (sendToRemote) {
            seekRemote(newTime, false);
        }
        setPlayerState((prevState) => ({
            ...prevState,
            progress: newTime / playerState.totalDuration,
            curTimeStr: formatTime(videoRef.current.currentTime),
            playing: false,
        }));
        restartHideControlsTimer();
    }

    function seekToPreview(e) {
        const newProgress = movePreview(e);
        const newTime = newProgress * playerState.totalDuration
        seekTo(newTime, true, true);
    }

    function onPreviewHover(e) {
        if (e.buttons === 1 || e.buttons === 3) {
            seekToPreview(e);
        } else {
            movePreview(e);
        }
    }

    function seekToVolume(e) {
        const bounds = e.target.getBoundingClientRect();
        const maxDx = volumeSliderRef.current.clientWidth;
        const dx = clamp(e.clientX - bounds.left, 0, maxDx);
        setPlayerState((prevState) => ({
            ...prevState,
            volume: dx / maxDx
        }));
        restartHideControlsTimer();
    }

    function onVolumeHover(e) {
        if (e.buttons === 1 || e.buttons === 3) {
            seekToVolume(e);
        }
    }

    function playerKeyboardListener(e) {
        console.log(`Key: '${e.key}'`);
        // TODO: enable throttle here?
        if (e.key === ' ') {
            togglePlayback();
            e.preventDefault();
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ф') {
            seekTo(clamp(videoRef.current.currentTime - 10, 0, playerState.totalDuration), false, true);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'в') {
            seekTo(clamp(videoRef.current.currentTime + 10, 0, playerState.totalDuration), false, true);
        } else if (e.key === ',' || e.key === 'б') {
            seekTo(clamp(videoRef.current.currentTime - (e.ctrlKey ? 5 : 1) / 24, 0, playerState.totalDuration), false, true);
        } else if (e.key === '.' || e.key === 'ю') {
            seekTo(clamp(videoRef.current.currentTime + (e.ctrlKey ? 5 : 1) / 24, 0, playerState.totalDuration), false, true);
        }
    }

    function toggleFullScreen() {
        if (
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        ) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        } else {
            const element = playerRef.current;
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
            element.focus();
        }
    }

    function renderUsers(users) {
        return users.map((user) => (
            <li className="user" key={user.userId}>
                <div className="user-image">
                    <SquareAvatar width={40} height={40} seed={user.userId}/>
                </div>
                <div className="user-left">
                    <FontAwesomeIcon icon={user.status === 'paused' ? faPause : faPlay}/>
                </div>
                <div className="user-right">
                    <FontAwesomeIcon icon={user.status !== 'loading' ? faCheck : faClock}/>
                </div>
                <div className="user-bottom">
                    <span className="time dots">{formatTime(user.time)}</span>
                </div>
            </li>
        ));
    }

    function changeEpisode(episodeId) {
        if (episodeId === remotePlaybackState.episodeId) {
            return;
        }
        xmlRequestRef.current.abort();
        setDownloadStatus({
            overlay: true,
            error: null,
            progress: 0,
        });
        changeEpisodeRemote(episodeId);
    }

    function renderEpisodes(files) {
        return files.map((file) => (
            <li
                key={file.id}
                className={`episode-entry ${file.id === remotePlaybackState.episodeId ? 'current-episode' : ''}`}
                onClick={() => changeEpisode(file.id)}>
                <span>{file.name}</span>
            </li>
        ));
    }

    return (
        <div className="app">
            <section className="main-column">
                <header className="main-header">
                    <SquareAvatar seed={myUserId} width={40} height={40}/>
                </header>
                <main>
                    <div
                        className={`player ${playerState.showControls ? '' : 'immersed'}`}
                        onMouseMove={restartHideControlsTimer}
                        onKeyDown={playerKeyboardListener}
                        tabIndex="0"
                        ref={playerRef}>
                        <div className="video-container">
                            <div className={`download-overlay ${downloadStatus.overlay ? 'show' : ''}`}>
                                <div className='download-info'>
                                    {downloadStatus.progress !== null ?
                                        <RoflexProgressBar progress={downloadStatus.progress}
                                                           width={500}
                                                           text={downloadStatus.progress !== null ? `${Math.floor(downloadStatus.progress * 100)} %` : ''}/> :
                                        <span>{downloadStatus.error}</span>}
                                </div>
                            </div>
                            <video
                                preload="true"
                                ref={videoRef}
                                className="video"
                                onClick={togglePlayback}
                                src={blobSrc}/>
                            <div>
                                <div className="userList">
                                    {renderUsers(users)}
                                </div>
                                <div className="controls">
                                    <div>
                                        <button
                                            className={`play-pause-btn ${playerState.playing ? 'play' : 'pause'}`}
                                            onClick={togglePlayback}/>
                                        <div>{playerState.curTimeStr}</div>
                                        <div
                                            className="slider seeker"
                                            onMouseMove={onPreviewHover}
                                            onMouseDown={seekToPreview}
                                            ref={sliderRef}>
                                            <div className="preview"
                                                 style={{left: `${playerState.previewLeft * 100}%`}}>
                                                {playerState.previewTimeStr}
                                            </div>
                                            <div className="handle"
                                                 style={{width: `${playerState.progress * 100}%`}}/>
                                        </div>
                                        <div className="duration">{playerState.totalTimeStr}</div>
                                        <div
                                            className="slider volume"
                                            onMouseMove={onVolumeHover}
                                            onMouseDown={seekToVolume}
                                            ref={volumeSliderRef}>
                                            <div className="handle"
                                                 style={{width: `${playerState.volume * 100}%`}}/>
                                        </div>
                                        <button onClick={toggleFullScreen}>
                                            <svg className="icon">
                                                <g id="fullscreen">
                                                    <polygon points="8,2 14,2 14,8 12,8 12,4 8,4"/>
                                                    <polygon points="2,8 4,8 4,12 8,12 8,14 2,14"/>
                                                </g>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="information">
                        <div className="series-title">
                            <span><b>{information.seriesName}</b></span>
                        </div>
                        <div className="episode-title">
                            <span>Эпизод {information.episodeNumber}</span>
                        </div>
                    </div>
                    <div className="episode-list">
                        <ul>{series ? renderEpisodes(series.files) : ''}</ul>
                    </div>
                </main>
                <footer className="main-footer">

                </footer>
            </section>
        </div>
    );
}


export default Watch;
