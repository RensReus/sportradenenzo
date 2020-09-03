import React, { Component } from 'react';
import Table from '../../shared/table'

class StageResultsTables extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classificationIndex: 0
    }
  }

  componentDidMount() {
    if (this.props.stage === 22) {
      this.setState({
        classificationIndex: 1
      })
    }
  }
  showResult(i) {
    this.props.changedClassificationDisplay(i);
    this.setState({ classificationIndex: i });
  }
  render() {
    var klassementen = [];
    for (var i = 0; i < 5; i++) {
      if (this.props.data[i]) {
        klassementen.push(this.props.data[i]);
      } else {
        klassementen.push([])
      }
    }
    var classificationNamesButtons = ['Etappe', 'Algemeen', 'Punten', 'Bergen', 'Jong'];
    var classificationNames = ['Etappe', 'Algemeen Klassement', 'Punten Klassement', 'Bergen Klassement', 'Jongeren Klassement'];
    return (
      <div className="classificationsContainer">
        <div style={{ display: 'flex' }}>
          {classificationNamesButtons.map((element, index) => {
            var buttonclassname = "klassementButton ";
            buttonclassname += index === this.state.classificationIndex ? 'block' : 'none';
            return <button style={{ display: 'block' }} disabled={this.props.stageResultsLengths[index] === 0} className={buttonclassname} key={element} onClick={this.showResult.bind(this, index)}>{element}</button>
          })}
        </div>
        <div className="classification">
          <Table data={klassementen[this.state.classificationIndex]} title={classificationNames[this.state.classificationIndex]} maxRows={20} classNames="classification" />
        </div>
      </div>
    )
  }
}

export default StageResultsTables