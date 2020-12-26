import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import Select, { createFilter } from "react-select";

import { exports as gu } from "../../dtale/gridUtils";

function validateDatetimeCfg(cfg) {
  const { col } = cfg;
  if (_.isNull(col)) {
    return "Missing a column selection!";
  }
  return null;
}

const FREQ_MAPPING = { month: "'M'", quarter: "'Q'", year: "'Y'" };

function buildCode({ col, operation, property, conversion }) {
  if (_.isNull(col)) {
    return null;
  }
  let code = "";
  if (operation === "property") {
    if (_.isNull(property)) {
      return null;
    }
    code = `df['${col.value}'].dt.${property}`;
  } else {
    if (_.isNull(conversion)) {
      return null;
    }
    const [freq, how] = _.split(conversion, "_");
    code = `df['${col.value}'].dt.to_period(${FREQ_MAPPING[freq]}).dt.to_timestamp(how='${how}')`;
  }
  return code;
}

class CreateDatetime extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      col: null,
      operation: "property",
      property: null,
      conversion: null,
    };
    this.updateState = this.updateState.bind(this);
    this.renderOperationOptions = this.renderOperationOptions.bind(this);
  }

  updateState(state) {
    const currState = _.assignIn(this.state, state);
    const cfg = _.pick(currState, ["operation", currState.operation]);
    cfg.col = _.get(currState, "col.value") || null;
    const code = buildCode(currState);
    this.setState(currState, () => this.props.updateState({ cfg, code }));
  }

  renderOperationOptions() {
    const { operation } = this.state;
    let label = null,
      options = null,
      className = "";
    if (operation === "property") {
      label = "Properties";
      options = ["minute", "hour", "time", "date", "weekday", "month", "quarter", "year"];
    } else {
      label = "Conversions";
      options = ["month_start", "month_end", "quarter_start", "quarter_end", "year_start", "year_end"];
      className = " datetime-conversions";
    }
    return (
      <div key={2} className="form-group row">
        <label className="col-md-3 col-form-label text-right">{label}</label>
        <div className="col-md-8">
          <div className="btn-group">
            {_.map(options, option => {
              const buttonProps = { className: `btn btn-primary${className}` };
              if (option === this.state[operation]) {
                buttonProps.className += " active";
              } else {
                buttonProps.className += " inactive";
                buttonProps.onClick = () => this.updateState({ [operation]: option });
              }
              return (
                <button key={option} {...buttonProps}>
                  {_.join(_.map(_.split(option, "_"), _.capitalize), " ")}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  render() {
    const columnOptions = _.map(
      _.filter(this.props.columns || [], c => gu.findColType(c.dtype) == "date"),
      ({ name }) => ({ value: name })
    );
    return [
      <div key={0} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Column</label>
        <div className="col-md-8">
          <div className="input-group">
            <Select
              className="Select is-clearable is-searchable Select--single"
              classNamePrefix="Select"
              options={_.sortBy(columnOptions, o => _.toLower(o.value))}
              getOptionLabel={_.property("value")}
              getOptionValue={_.property("value")}
              value={this.state.col}
              onChange={selected => this.updateState({ col: selected })}
              noOptionsText={() => "No columns found"}
              isClearable
              filterOption={createFilter({ ignoreAccents: false })} // required for performance reasons!
            />
          </div>
        </div>
      </div>,
      <div key={1} className="form-group row">
        <label className="col-md-3 col-form-label text-right">Operation</label>
        <div className="col-md-8">
          <div className="btn-group">
            {_.map(["property", "conversion"], operation => {
              const buttonProps = { className: "btn" };
              if (operation === this.state.operation) {
                buttonProps.className += " btn-primary active";
              } else {
                buttonProps.className += " btn-primary inactive";
                buttonProps.onClick = () => this.updateState({ operation });
              }
              return (
                <button key={operation} {...buttonProps}>
                  {_.capitalize(operation)}
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      this.renderOperationOptions(),
    ];
  }
}
CreateDatetime.displayName = "CreateDatetime";
CreateDatetime.propTypes = {
  updateState: PropTypes.func,
  columns: PropTypes.array,
};

export { CreateDatetime, validateDatetimeCfg, buildCode };
