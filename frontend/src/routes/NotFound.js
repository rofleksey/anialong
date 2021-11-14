import './App.css';
import logo from '../logo.png';
import img404 from '../404.webm'
import React, {useEffect, useState} from "react";

function NotFound() {
    return (
        <div className="app">
            <section className="main-column">
                <header className="main-header">
                    <img
                        className="logo"
                        alt="logo"
                        src={logo}
                    />
                </header>
                <main>
                    <div className="not-found">
                        <video autoPlay={true} loop muted preload="metadata">
                            <source src={img404} type="video/webm" />
                        </video>
                        <span>Страница не найдена</span>
                    </div>
                </main>
                <footer className="main-footer">

                </footer>
            </section>
        </div>
    );
}

export default NotFound;
