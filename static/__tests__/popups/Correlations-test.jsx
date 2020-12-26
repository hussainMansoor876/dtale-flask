/* eslint max-lines: "off" */
import qs from "querystring";

import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Select from "react-select";

import { expect, it } from "@jest/globals";

import CorrelationsTsOptions from "../../popups/correlations/CorrelationsTsOptions";
import mockPopsicle from "../MockPopsicle";
import correlationsData from "../data/correlations";
import { buildInnerHTML, tickUpdate, withGlobalJquery } from "../test-utils";

const chartData = {
  visible: true,
  type: "correlations",
  title: "Correlations Test",
  query: "col == 3",
};

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("Correlations tests", () => {
  const { opener } = window;
  let Correlations, ChartsBody, CorrelationsGrid, CorrelationScatterStats;
  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

    delete window.opener;
    window.opener = { location: { reload: jest.fn() } };

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (_.startsWith(url, "/dtale/correlations/")) {
          const query = qs.parse(url.split("?")[1]).query;
          if (query == "null") {
            return { error: "No data found." };
          }
          if (query == "one-date") {
            return {
              data: correlationsData.data,
              dates: [{ name: "col4", rolling: false }],
            };
          }
          if (query == "no-date") {
            return { data: correlationsData.data, dates: [] };
          }
          if (query == "rolling") {
            const dates = [
              { name: "col4", rolling: true },
              { name: "col5", rolling: false },
            ];
            return { data: correlationsData.data, dates };
          }
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      chartCfg.getDatasetMeta = _idx => ({
        controller: { _config: { selectedPoint: 0 } },
      });
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    Correlations = require("../../popups/Correlations").Correlations;
    ChartsBody = require("../../popups/charts/ChartsBody").default;
    CorrelationsGrid = require("../../popups/correlations/CorrelationsGrid").default;
    CorrelationScatterStats = require("../../popups/correlations/CorrelationScatterStats").default;
  });

  beforeEach(async () => {
    buildInnerHTML({ settings: "" });
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    window.opener = opener;
  });

  const buildResult = async (props = { chartData }) => {
    const result = mount(<Correlations {...props} dataId="1" />, {
      attachTo: document.getElementById("content"),
    });
    await tickUpdate(result);
    return result;
  };

  it("Correlations rendering data", async () => {
    const result = await buildResult();
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(
      result
        .find("select.custom-select")
        .first()
        .find("option")
        .map(o => o.text())
    ).toEqual(["col4", "col5"]);
    result
      .find("select.custom-select")
      .first()
      .simulate("change", { target: { value: "col5" } });
    await tickUpdate(result);
    expect(result.state().selectedDate).toBe("col5");
  });

  it("Correlations rendering data and filtering it", async () => {
    const result = await buildResult();
    let corrGrid = result.find(CorrelationsGrid).first();
    const filters = corrGrid.find(Select);
    filters.first().instance().onChange({ value: "col1" });
    result.update();
    corrGrid = result.find(CorrelationsGrid).first();
    expect([correlationsData.data[0]]).toEqual(corrGrid.instance().state.correlations);
    filters.last().instance().onChange({ value: "col3" });
    result.update();
    expect([{ column: "col1", col3: -0.098802 }]).toEqual(corrGrid.instance().state.correlations);
  });

  it("Correlations rendering data w/ one date column", async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: "one-date" },
    });
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    expect(result.find("select.custom-select").length).toBe(0);
    expect(result.state().selectedDate).toBe("col4");
  });

  it("Correlations rendering data w/ no date columns", async () => {
    const props = {
      chartData: _.assign({}, chartData, { query: "no-date" }),
      onClose: _.noop,
      propagateState: _.noop,
    };
    const result = await buildResult(props);
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find("#rawScatterChart").length).toBe(1);
    const scatterChart = result.find(Correlations).instance().state.chart;
    const title = scatterChart.cfg.options.tooltips.callbacks.title([{ datasetIndex: 0, index: 0 }], scatterChart.data);
    expect(title).toEqual(["index: 0"]);
    const label = scatterChart.cfg.options.tooltips.callbacks.label({ datasetIndex: 0, index: 0 }, scatterChart.data);
    expect(label).toEqual(["col1: 1.4", "col2: 1.5"]);
    scatterChart.cfg.options.onClick({});
    const corr = result.instance();
    expect(corr.shouldComponentUpdate(_.assignIn({ foo: 1 }, corr.props))).toBe(true);
    expect(corr.shouldComponentUpdate(corr.props, _.assignIn({}, corr.state, { chart: null }))).toBe(false);
    expect(corr.shouldComponentUpdate(corr.props, corr.state)).toBe(false);
  });

  it("Correlations rendering rolling data", async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: "rolling" },
    });
    await tickUpdate(result);
    const corrGrid = result.first().find("div.ReactVirtualized__Grid__innerScrollContainer");
    corrGrid.find("div.cell").at(1).simulate("click");
    await tickUpdate(result);
    expect(result.find(ChartsBody).length).toBe(1);
    result.find(ChartsBody).instance().state.charts[0].cfg.options.onClick({ foo: 1 });
    await tickUpdate(result);
    expect(result.find(Correlations).instance().state.chart).toBeDefined();
    expect(
      _.startsWith(result.find(CorrelationScatterStats).text(), "col1 vs. col2 for 2018-12-16 thru 2018-12-19")
    ).toBe(true);
    expect(
      result
        .find(Correlations)
        .instance()
        .state.chart.cfg.options.tooltips.callbacks.title(
          [{ datasetIndex: 0, index: 0 }],
          result.find(Correlations).instance().state.chart.data
        )
    ).toEqual(["index: 0", "date: 2018-04-30"]);
    expect(
      result
        .find("select.custom-select")
        .first()
        .find("option")
        .map(o => o.text())
    ).toEqual(["col4", "col5"]);
    expect(result.state().selectedDate).toBe("col4");
    result
      .find(CorrelationsTsOptions)
      .find("input")
      .findWhere(i => i.prop("type") === "text")
      .first()
      .simulate("change", { target: { value: "5" } });
    const minPeriods = result
      .find(CorrelationsTsOptions)
      .find("input")
      .findWhere(i => i.prop("type") === "text")
      .first();
    minPeriods.simulate("change", { target: { value: "5" } });
    minPeriods.simulate("keyPress", { key: "Enter" });
    await tickUpdate(result);
  });

  it("Correlations missing data", async () => {
    const result = await buildResult({
      chartData: { ...chartData, query: "null" },
    });
    expect(result.find("div.ReactVirtualized__Grid__innerScrollContainer").length).toBe(0);
  });

  it("Correlations - percent formatting", () => {
    const { percent } = require("../../popups/correlations/correlationsUtils").default;
    expect(percent("N/A")).toBe("N/A");
  });
});
