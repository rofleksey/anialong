import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Home from './routes/Home';
import {HashRouter, Route, Routes} from 'react-router-dom';
import reportWebVitals from './reportWebVitals';
import Watch from "./routes/Watch";
import NotFound from "./routes/NotFound";

ReactDOM.render(
    <HashRouter>
        <Routes>
            <Route exact path="/" element={<Home />} />
            <Route exact path="/watch/:seriesId/:roomId" element={<Watch />}/>
            <Route path="*" element={<NotFound />}/>
        </Routes>
    </HashRouter>,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
