import './App.css';
import logo from '../logo.png';
import axios from 'axios';
import React, {useEffect, useMemo, useState} from "react";
import {nanoid} from "nanoid";
import {Link} from "react-router-dom";
import {isDev} from "../lib/util";

function renderList(baseUrl, series, newRoomId) {
    return (
        series.map((entry) => (
            <li key={entry.id}>
                <Link to={`/watch/${entry.id}/${newRoomId}`}>
                    <div className="series-title">
                        <span>{entry.name}</span>
                    </div>
                </Link>
            </li>
        ))
    )
}

function Home() {
    const baseUrl = useMemo(() => {
        return isDev() ? 'http://localhost:2021' : '';
    }, [])
    const [series, useSeries] = useState([]);
    const [newRoomId] = useState(nanoid(6));

    useEffect(() => {
        axios.get(`${baseUrl}/series`).then((res) => {
            // eslint-disable-next-line react-hooks/rules-of-hooks
            useSeries(res.data.series);
        }).catch((err) => {
            console.error(err);
        });
    }, []);

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
                    <div className="search">
                        <input
                            className="search-input"
                            autoFocus={true}
                            placeholder="ПОИСК"/>
                        <nav className="series">
                            <ul className="series-list">
                                {renderList(baseUrl, series, newRoomId)}
                            </ul>
                        </nav>
                    </div>
                </main>
                <footer className="main-footer">

                </footer>
            </section>
        </div>
    );
}

export default Home;
