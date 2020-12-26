import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";

import { dataLoader } from "../analysis/columnAnalysisUtils";
import { DescribeFilters } from "../analysis/filters/DescribeFilters";
import DetailsBoxplot from "./DetailsBoxplot";

class DetailsCharts extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      chart: null,
      type: "boxplot",
      error: null,
      chartParams: null,
      ...props,
    };
    this.buildChart = this.buildChart.bind(this);
  }

  componentDidMount() {
    this.buildChart({ type: "boxplot" });
  }

  shouldComponentUpdate(newProps, newState) {
    if (!_.isEqual(this.props, newProps)) {
      return true;
    }
    const updateState = ["type", "error", "chartParams", "chart"];
    if (!_.isEqual(_.pick(this.state, updateState), _.pick(newState, updateState))) {
      return true;
    }
    return false;
  }

  componentDidUpdate(prevProps) {
    if (!_.isEqual(this.props, prevProps)) {
      this.setState(this.props, () => this.buildChart({ type: "boxplot" }));
    }
  }

  buildChart(chartParams) {
    const finalParams = chartParams || this.state.chartParams;
    if (finalParams.type === "boxplot") {
      const { details, detailCode } = this.props;
      this.setState({
        chart: <DetailsBoxplot details={details} />,
        code: detailCode,
        query: null,
      });
    } else {
      const propagateState = state => this.setState(state);
      const props = {
        chartData: { selectedCol: this.props.col },
        height: 400,
        dataId: this.props.dataId,
      };
      dataLoader(props, this.state, propagateState, finalParams);
    }
  }

  render() {
    const { details } = this.props;
    return (
      <React.Fragment>
        <div className="row">
          <div className="col-md-12">
            <DescribeFilters
              {..._.pick(this.state, ["type", "cols", "dtype", "code", "top"])}
              chartType={this.state.type}
              selectedCol={this.props.col}
              buildChart={this.buildChart}
              details={details}
            />
          </div>
        </div>
        {this.state.chart}
      </React.Fragment>
    );
  }
}
DetailsCharts.displayName = "DetailsCharts";
DetailsCharts.propTypes = {
  details: PropTypes.object,
  detailCode: PropTypes.string,
  cols: PropTypes.array,
  dtype: PropTypes.string,
  col: PropTypes.string,
  dataId: PropTypes.string,
};

export default DetailsCharts;
