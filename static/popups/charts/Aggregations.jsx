import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";
import { AGGREGATION_OPTS, ROLLING_COMPS } from "../analysis/filters/Constants";

function getAggregations({ columns, x, group }) {
  if (gu.isDateCol(gu.getDtype(_.get(x, "value"), columns)) && _.isEmpty(group)) {
    return AGGREGATION_OPTS;
  }
  return _.reject(AGGREGATION_OPTS, { value: "rolling" });
}

class Aggregations extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      aggregation: props.aggregation ? _.find(AGGREGATION_OPTS, { value: props.aggregation }) : null,
      rollingComputation: null,
      rollingWindow: "4",
    };
    this.update = this.update.bind(this);
    this.renderRolling = this.renderRolling.bind(this);
  }

  update(val, upperVal) {
    this.setState(val, () => this.props.propagateState(upperVal));
  }

  renderRolling() {
    if (_.get(this.state, "aggregation.value") === "rolling") {
      const { rollingWindow, rollingComputation } = this.state;
      return [
        <div key={3} className="col-auto">
          <div className="input-group">
            <span className="input-group-addon">Window</span>
            <input
              style={{ width: "3em" }}
              className="form-control text-center"
              type="text"
              value={rollingWindow || ""}
              onChange={e =>
                this.update(
                  { rollingWindow: _.get(e, "target.value", "") },
                  { rollingWindow: _.get(e, "target.value", "") }
                )
              }
            />
          </div>
        </div>,
        <div key={5} className="col-auto">
          <div className="input-group mr-3">
            <span className="input-group-addon">Computation</span>
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={ROLLING_COMPS}
              getOptionLabel={_.property("label")}
              getOptionValue={_.property("value")}
              value={rollingComputation}
              onChange={rollingComputation =>
                this.update({ rollingComputation }, { rollingComputation: _.get(rollingComputation, "value") })
              }
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>,
        <div key={6} className="col" />,
      ];
    }
    return <div key={2} className="col" />;
  }

  render() {
    return [
      <div key={1} className="col-auto">
        <div className="input-group mr-3">
          <span className="input-group-addon">Aggregation</span>
          <Select
            className="Select is-clearable is-searchable Select--single"
            classNamePrefix="Select"
            options={getAggregations(this.props)}
            getOptionLabel={_.property("label")}
            getOptionValue={_.property("value")}
            value={this.state.aggregation}
            onChange={aggregation => this.update({ aggregation }, { aggregation: _.get(aggregation, "value") })}
            isClearable
            filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
          />
        </div>
      </div>,
      this.renderRolling(),
    ];
  }
}
Aggregations.displayName = "Aggregations";
Aggregations.propTypes = {
  propagateState: PropTypes.func,
  columns: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  x: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
  group: PropTypes.arrayOf(PropTypes.object), // eslint-disable-line react/no-unused-prop-types
  aggregation: PropTypes.string, // eslint-disable-line react/no-unused-prop-types
};

export { Aggregations };
