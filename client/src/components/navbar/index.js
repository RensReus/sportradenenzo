import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import './index.css';

class Navbar extends Component {
    render() {
        let buttonLog;
        let buttonSignProfile;
        if (this.props.isLoggedIn) {
            buttonSignProfile = <li><Link to="/profile">Profile</Link></li>;
            buttonLog = <li><Link to="/logout">Logout</Link></li>;
        } else {
            buttonSignProfile = <li><Link to="/signup">Signup</Link></li>;
            buttonLog = <li><Link to="/login">Login</Link></li>;
        }
        return (
            <div className="navbar">
                <ul>
                    {buttonSignProfile}
                </ul>
                <div className="dropdown">
                    <button className="dropbtn">Charts</button>
                    <div className="dropdown-content">
                        <a href="/charts/userscores">Relatief Scoreverloop</a>
                        <a href="/charts/riderpercentage">Puntenaandeel Renner per Etappe</a>
                        <a href="/charts/riderpercentagetotal">Puntenaandeel Renner totaal</a>
                    </div>
                    </div> 
            </div>
        )
    }
}

export default Navbar