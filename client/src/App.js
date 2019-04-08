import React, { Component } from 'react';
import { Route, Redirect} from 'react-router-dom';
import './index.css';
import axios from 'axios';

import Navbar from './components/navbar';

import Home from './components/home';
import Profile from './components/profile';
import Stage from './components/stage'
import Teamselection from './components/teamselection';
import Admin from './components/admin';
import Etappewinsten from './components/etappewinsten';
import Overzicht from './components/overzicht';
import Charts from './components/charts';
import Versus from './components/versus';
import ManualUpdate from './components/manualupdate'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = ({ isLoggedIn: false,
                    redirect: '/',
                  isAdmin: false });//de default voor redirect
  }

  componentWillMount() {
    //Voordat de pagina wordt geladen kijken of de gebruiker is ingelogd
    axios.post('/api/isloggedin', { withCredentials: true }) //to: authentication.js
      .then((res) => {
        if(this.props.history.location.pathname !== '/'){
          this.setState({redirect: this.props.history.location.pathname})//om de user door te sturen na de login
        }
        if (this.state.isLoggedIn !== res.data) { //Als er verandering is moet de state worden aangepast
          this.setState({ isLoggedIn: res.data.isLoggedIn,
          isAdmin: res.data.isAdmin }); //true of false
        }
        if (!this.state.isLoggedIn && this.props.history.location.pathname !== '/') { //Als er niet is ingelogd en de gebruiker is niet op de loginpagina -> redirect
          this.props.history.replace('/');
        }
      })
  }

  render() {
    //Kijk of de gebruiker is ingelogd bij elke update van de pagina
    axios.post('/api/isloggedin', { withCredentials: true }) //to: authentication.js
      .then((res) => {
        if (this.state.isLoggedIn !== res.data.isLoggedIn) { //Als er verandering is moet de state worden aangepast
          this.setState({ isLoggedIn: res.data.isLoggedIn,
            isAdmin: res.data.isAdmin }); //true of false
        }
        if (!this.state.isLoggedIn && this.props.history.location.pathname !== '/') { //Als er niet is ingelogd en de gebruiker is niet op de loginpagina -> redirect
          this.props.history.replace('/');
        }
      })
      .catch(function (error) {
        throw error
      });
      if(this.state.redirect === '/'){
        axios.post('/api/currentstagenum')
          .then(res =>{
            var newRedir = '/stage/' + res.data;
            this.setState({redirect: newRedir})
          })
      }

    return (
      // alle routing moet ff in een aparte file komen 
      // de switch en redirect zorgen ervoor dat 404 errors niet meer voorkomen 
      //maar maken admin en manual update onbereikbaar wss vanwege de admin check
      <div className="content">
        <div className="backgroundImage"></div>
        <Navbar isLoggedIn={this.state.isLoggedIn} isAdmin={this.state.isAdmin} />
        <div className="pageContainer">
        
        {/* <Switch> */}
            <Route exact path="/" render={() => (
              this.state.isLoggedIn ? (<Redirect to={this.state.redirect} />) : (<Home history={this.props.history} />)
            )} />
            <Route path="/profile" component={Profile} history={this.props.history} />
            <Route exact path="/stage/:stagenumber" component={Stage} history={this.props.history} />
            <Route path="/teamselection" component={Teamselection} history={this.props.history} />
            {this.state.isAdmin &&// dit kan wss mooier maar non-admins kunnen nooit op de admin pagina komen
                  <Route path="/admin" component={Admin} history={this.props.history} />}
            {this.state.isAdmin &&// dit kan wss mooier maar non-admins kunnen nooit op de admin pagina komen
                  <Route path="/manualupdate" component={ManualUpdate} history={this.props.history} />}
            
            <Route path="/etappewinsten" component={Etappewinsten} history={this.props.history} />
            <Route path="/overzicht/:selection" component={Overzicht} history={this.props.history} />
            <Route path="/charts/:chartname" component={Charts} history={this.props.history} />
            <Route path="/vs/:username" component={Versus} history={this.props.history} />
            {/* <Redirect to='/'/>
          </Switch> */}
        </div>
      </div>
    );
  }
}

export default App;