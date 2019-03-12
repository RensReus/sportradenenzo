import React, { Component } from 'react';
import axios from 'axios';
import './index.css';



class manualupdate extends Component {
    constructor(props) {
        super(props);
        this.getStartlistKlassiek = this.getStartlistKlassiek.bind(this);
        this.getResultsKlassiek = this.getResultsKlassiek.bind(this);
        this.getStartlist = this.getStartlist.bind(this);
        this.getResults = this.getResults.bind(this);

        this.changeGSKText = this.changeGSKText.bind(this);
        this.changeGRKText = this.changeGRKText.bind(this);
        this.changeGRText = this.changeGRText.bind(this);

        this.handleChangeYear = this.handleChangeYear.bind(this);
        this.handleChangeName = this.handleChangeName.bind(this);

        this.state = {
            gskStage: "",
            grkStage: "",
            grStage: "",
            year: "2019",
            raceName: "giro"
        }
    }

    //button click handlers
    getStartlistKlassiek() {
        var stage = Number(this.state.gskStage);
        if (Number.isInteger(stage)) {
            stage = parseInt(stage);
            if (stage > 0 && stage < 17) {
                console.log("stage:", stage);
                axios.post('/api/getstartlistklassiek', { year: 2019, stage: stage })
                    .then((res) => {
                        this.setState({ gskStage: res.data })
                    })
            } else {
                console.log("not in range", stage)
            }
        } else {
            console.log("not an int:", stage)
        }
    }

    getResultsKlassiek() {
        var stage = Number(this.state.grkStage);
        if (Number.isInteger(stage)) {
            stage = parseInt(stage);
            if (stage > 0 && stage < 17) {
                console.log("stage:", stage);
                axios.post('/api/getresultsklassiek', { year: 2019, stage: stage })
                    .then((res) => {
                        this.setState({ grkStage: res.data })
                    })
            } else {
                console.log("not in range", stage)
            }
        } else {
            console.log("not an int:", stage)
        }
    }

    getStartlist() {
        axios.post('/api/getstartlist', { raceName: this.state.raceName, year: 2019})
        .then((res) => {
            this.setState({ grStage: res.data })            
        })
    }

    getResults() {
        var stage = Number(this.state.grStage);
        if (Number.isInteger(stage)) {
            stage = parseInt(stage);
            if (stage > 0 && stage < 22) {
                console.log("stage:", stage);
                axios.post('/api/getresults', { raceName: this.state.raceName, year: this.state.year, stage: stage })
                    .then((res) => {
                        this.setState({ grStage: res.data })
                    })
            } else {
                console.log("not in range", stage)
            }
        } else {
            console.log("not an int:", stage)
        }
    }

    //textfield value handlers
    changeGSKText(event) {
        this.setState({
            gskStage: event.target.value
        });
    }

    changeGRKText(event) {
        this.setState({
            grkStage: event.target.value
        });
    }

    changeGRText(event) {
        this.setState({
            grStage: event.target.value
        });
    }

    //dropdown select handlers
    handleChangeYear(event) {
        this.setState({ year: event.target.value });
    }

    handleChangeName(event) {
        this.setState({ raceName: event.target.value });
    }

    render() {
        console.log("renderK", this.state.year)
        console.log("render", this.state.raceName)

        return (
            <div className="mainContainer">
                <div className="iets">
                    <div className="title">Klassieker</div>
                    <div className="row">

                        <div>year</div>
                        <select value={this.state.year} onChange={this.handleChangeYear}>
                            <option value="2019">2019</option>
                            <option value="2020">2020</option>
                        </select>
                    </div>

                    <div className="row">
                        <div className="discription">Get Startlist </div>
                        <input className="inputfield" id="gsk" placeholder="Stage #" value={this.state.gskStage} onChange={this.changeGSKText} />
                        <button onClick={this.getStartlistKlassiek}>Send</button>
                    </div>

                    <div className="row">
                        <div className="discription">Get Results incl. userscores </div>
                        <input className="inputfield" id="grk" placeholder="Stage #" value={this.state.grkStage} onChange={this.changeGRKText} />
                        <button onClick={this.getResultsKlassiek}>Send</button>
                    </div>

                </div>
                <div className="iets">
                    <div className="title">Grote Ronde</div>
                    <div className="grMainRow">
                        <div>year</div>
                        <select value={this.state.year} onChange={this.handleChangeYear}>
                            <option value="2019">2019</option>
                            <option value="2020">2020</option>
                        </select>

                        <div>Name</div>
                        <select value={this.state.raceName} onChange={this.handleChangeName}>
                            <option value="giro">Giro</option>
                            <option value="tour">Tour</option>
                            <option value="vuelta">Vuelta</option>
                        </select>
                    </div>

                    <div className="row">
                        <button onClick={this.getStartlist}>Get Startlist</button>
                    </div>

                    <div className="row">
                        <div className="discription">Get Results incl. userscores</div>
                        <input className="inputfield" id="gk" placeholder="Stage #" value={this.state.grStage} onChange={this.changeGRText} />
                        <button onClick={this.getResults}>Send</button>
                    </div>
                </div>

            </div>
        )
    }
}

export default manualupdate