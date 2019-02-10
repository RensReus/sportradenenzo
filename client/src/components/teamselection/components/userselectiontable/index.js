import React, { Component } from 'react';

class Deselectionbutton extends Component{
    removeRider=()=> {
        this.props.removeRider(this.props.riderID);
    }
    render(){
        return(
            <button className={this.props.selected} onClick={() => this.removeRider(this.props.riderID)}>Remove Rider</button>
        )
    }
}

class UserRiderrow extends Component{
    render(){
        const rider = this.props
        return(
            <tr>
                <td>{rider.firstname}</td>
                <td>{rider.lastname}</td>
                <td>{rider.team}</td>
                <td>{rider.price}</td>
                <td><Deselectionbutton removeRider={this.props.removeRider} riderID={this.props.riderID}/></td>
            </tr>
        )
    }
}
class Userselectiontable extends Component{
    render(){
        const rows = [];
        this.props.selection.map(({firstname,lastname,team,price,rider_participation_id})=>{
            rows.push(
                <UserRiderrow firstname={firstname} lastname={lastname} team={team} price={price} key={rider_participation_id} riderID={rider_participation_id} removeRider={this.props.removeRider}/>
            )
        });
        return(
            <table>
                <thead>
                    <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Team</th>
                        <th>Price</th>
                    </tr>
                </thead>
            <tbody>{rows}</tbody>
            </table>
        )
    }
}

export default Userselectiontable