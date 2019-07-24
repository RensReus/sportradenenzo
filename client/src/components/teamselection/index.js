import React, { Component } from 'react';
import Riderselectiontable from './riderselectiontable'
import Userselectiontable from './userselectiontable'
import axios from 'axios';
import './index.css';
import BudgetSwitchButton from '../shared/budgetSwitchButton';

class Teamselection extends Component{
    constructor(props){
        super(props);
        this.state = {
            allRiders: [],
            userSelectionGewoon: [], 
            userSelectionBudget: [], 
            race: 'tour', 
            year: '2019', 
            budgetGewoon: 0,
            budgetBudget: 0,
        showBudget: false}
        this.addRider = this.addRider.bind(this);
        this.removeRider = this.removeRider.bind(this);
        this.updatePage = this.updatePage.bind(this);
    }
    addRider = (riderID, budgetParticipation) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionadd',{race, year, rider_participation_id : riderID, budgetParticipation, token: localStorage.getItem('authToken') })
        .then((res)=>{
            if(res){
               this.updatePage(res.data,budgetParticipation);
            }
        })
    }
    removeRider = (riderID, budgetParticipation) =>{
        const race = this.state.race
        const year = this.state.year
        axios.post('/api/teamselectionremove',{race, year, rider_participation_id : riderID, budgetParticipation, token: localStorage.getItem('authToken') })
        .then((res)=>{
            if(res){
               this.updatePage(res.data,budgetParticipation);
            }
        })
    }
    componentDidMount() {
        const race = this.state.race
        const year = this.state.year
        document.title = "Team Keuze " + race;
        console.log("redir",this.props.redirect)
        if(this.props.redirect === '/teamselection'){
            axios.post('/api/getridersandteam',{race, year, token: localStorage.getItem('authToken')}) //to: teamselection.js
            .then((res)=>{
                this.setState({
                    allRiders: res.data.allRiders,
                    userSelectionGewoon: res.data.userSelectionGewoon,
                    budgetGewoon: res.data.budgetGewoon,
                    userSelectionBudget: res.data.userSelectionBudget,
                    budgetBudget: res.data.budgetBudget
                })
            })
        }else{
            this.redirect(this.props.redirect)
        }
    }

    updatePage(data,showBudget){
        if(data){
            if(showBudget){
                this.setState({
                    userSelectionBudget: data.userSelection,
                    budgetBudget: data.budget
                })
            }else{
                this.setState({
                    userSelectionGewoon: data.userSelection,
                    budgetGewoon: data.budget
                })
            }
        }
    }

    budgetSwitch(){
        this.setState({showBudget:!this.state.showBudget})
    }

    redirect = (url) => {
        console.log("redirfucnt")
        this.props.history.push(url);
    }

    render(){
        const allRiders = this.state.allRiders
        const selectionGewoon = this.state.userSelectionGewoon
        const budgetGewoon = this.state.budgetGewoon
        const selectionBudget = this.state.userSelectionBudget
        const budgetBudget = this.state.budgetBudget
        return(
            <div className="container">
                
                <BudgetSwitchButton budget = {this.state.budget} budgetSwitch = {this.budgetSwitch}/>
                <div className="ridertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <div className="teamindicator">
                        Gewone Team Selectie
                    </div>
                    <Riderselectiontable riders={allRiders} selectionIDs={selectionGewoon.map(rider=> rider.rider_participation_id)} selectionTeams={selectionGewoon.map(rider=> rider.team)} budget={budgetGewoon} addRider={this.addRider} budgetParticipation={false}/>
                </div>
                <div className="usertablecontainer" style={{display: this.state.showBudget ? 'none' : 'block'}}>
                    <div className="budget">
                        Budget Left: {this.state.budgetGewoon} Renners {selectionGewoon.length}/20
                    </div>
                    <Userselectiontable selection={selectionGewoon} removeRider={this.removeRider} budgetParticipation = {false}/>
                </div>
                <div className="ridertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <div className="teamindicator">
                        Budget Team Selectie
                    </div>
                    <Riderselectiontable riders={allRiders} selectionIDs={selectionBudget.map(rider=> rider.rider_participation_id)} selectionTeams={selectionBudget.map(rider=> rider.team)} budget={budgetBudget} addRider={this.addRider} budgetParticipation={true}/>
                </div>
                <div className="usertablecontainer" style={{display: !this.state.showBudget ? 'none' : 'block'}}>
                    <div className="budget">
                        Budget Left: {this.state.budgetBudget} Renners {selectionBudget.length}/20
                    </div>
                    <Userselectiontable selection={selectionBudget} removeRider={this.removeRider} budgetParticipation = {true}/>
                </div>
                <div id="stage1button">
                        <button onClick={() => this.redirect('/stage/1')}>To stages </button>
                </div>
            </div>
        )
    }
}

export default Teamselection