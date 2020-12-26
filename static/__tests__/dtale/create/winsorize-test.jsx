import { mount } from "enzyme";
import React from "react";
import { Provider } from "react-redux";
import Select from "react-select";
import ReactSlider from "react-slider";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../../MockPopsicle";
import reduxUtils from "../../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate, withGlobalJquery } from "../../test-utils";
import { clickBuilder } from "./create-test-utils";

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
const originalInnerWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerWidth");
const originalInnerHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "innerHeight");

function submit(res) {
  res.find("div.modal-footer").first().find("button").first().simulate("click");
}

describe("DataViewer tests", () => {
  let result, CreateColumn, CreateWinsorize;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1205,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 775,
    });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        const { urlFetcher } = require("../../redux-test-utils").default;
        return urlFetcher(url);
      })
    );

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      return chartCfg;
    });

    jest.mock("popsicle", () => mockBuildLibs);
    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
  });

  beforeEach(async () => {
    CreateColumn = require("../../../popups/create/CreateColumn").ReactCreateColumn;
    CreateWinsorize = require("../../../popups/create/CreateWinsorize").CreateWinsorize;
    const { DataViewer } = require("../../../dtale/DataViewer");

    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "Build Column");
    await tickUpdate(result);
    clickBuilder(result, "Winsorize");
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
    Object.defineProperty(window, "innerWidth", originalInnerWidth);
    Object.defineProperty(window, "innerHeight", originalInnerHeight);
  });

  const findWinsorize = () => result.find(CreateWinsorize);

  it("DataViewer: build winsorize column", async () => {
    expect(result.find(CreateWinsorize).length).toBe(1);
    findWinsorize().find(Select).first().instance().onChange({ value: "col1" });
    result.update();
    findWinsorize().find(Select).first().instance().onChange(null);
    result.update();
    findWinsorize().find(Select).first().instance().onChange({ value: "col1" });
    result.update();
    findWinsorize()
      .find(Select)
      .last()
      .instance()
      .onChange([{ value: "col2" }]);
    result.update();
    findWinsorize().find(ReactSlider).prop("onAfterChange")([20, 80]);
    result.update();
    findWinsorize().find(ReactSlider).prop("onAfterChange")([20, 80]);
    result.update();
    findWinsorize()
      .find("div.form-group")
      .at(2)
      .find("input")
      .first()
      .simulate("change", { target: { value: "30" } });
    result.update();
    findWinsorize()
      .find("div.form-group")
      .at(2)
      .find("input")
      .last()
      .simulate("change", { target: { value: "70" } });
    result.update();
    findWinsorize().find("i").first().simulate("click");
    result.update();
    findWinsorize().find("i").last().simulate("click");
    result.update();
    submit(result);
    await tick();
    expect(result.find(CreateColumn).instance().state.cfg).toEqual({
      col: "col1",
      group: ["col2"],
      limits: [0.3, 0.3],
      inclusive: [false, false],
    });
    expect(result.find(CreateColumn).instance().state.name).toBe("col1_winsorize");
  });

  it("DataViewer: build winsorize cfg validation", () => {
    const { validateWinsorizeCfg } = require("../../../popups/create/CreateWinsorize");
    expect(validateWinsorizeCfg({ col: null })).toBe("Please select a column to winsorize!");
    expect(
      validateWinsorizeCfg({
        col: "col1",
        group: ["col2"],
        limits: [0.1, 0.1],
        inclusive: [true, false],
      })
    ).toBeNull();
  });
});
