import { mount } from "enzyme";
import _ from "lodash";
import React from "react";
import Modal from "react-bootstrap/Modal";
import { Provider } from "react-redux";

import { expect, it } from "@jest/globals";

import mockPopsicle from "../MockPopsicle";
import reduxUtils from "../redux-test-utils";
import { buildInnerHTML, clickMainMenuButton, tick, tickUpdate, withGlobalJquery } from "../test-utils";

const pjson = require("../../../package.json");

const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");

describe("DataViewer tests", () => {
  let result, DataViewer, About;
  let testIdx = 0;

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      value: 500,
    });

    const mockBuildLibs = withGlobalJquery(() =>
      mockPopsicle.mock(url => {
        if (testIdx === 2 && _.includes(url, "pypi.org")) {
          return { info: { version: "999.0.0" } };
        }
        const { urlFetcher } = require("../redux-test-utils").default;
        return urlFetcher(url);
      })
    );
    jest.mock("popsicle", () => mockBuildLibs);

    const mockChartUtils = withGlobalJquery(() => (ctx, cfg) => {
      const chartCfg = { ctx, cfg, data: cfg.data, destroyed: false };
      chartCfg.destroy = () => (chartCfg.destroyed = true);
      chartCfg.getElementsAtXAxis = _evt => [{ _index: 0 }];
      chartCfg.getElementAtEvent = _evt => [{ _datasetIndex: 0, _index: 0, _chart: { config: cfg, data: cfg.data } }];
      return chartCfg;
    });

    jest.mock("chart.js", () => mockChartUtils);
    jest.mock("chartjs-plugin-zoom", () => ({}));
    jest.mock("chartjs-chart-box-and-violin-plot/build/Chart.BoxPlot.js", () => ({}));
    DataViewer = require("../../dtale/DataViewer").DataViewer;
    About = require("../../popups/About").default;
  });

  beforeEach(async () => {
    testIdx++;
    const store = reduxUtils.createDtaleStore();
    buildInnerHTML({ settings: "" }, store);
    result = mount(
      <Provider store={store}>
        <DataViewer />
      </Provider>,
      { attachTo: document.getElementById("content") }
    );
    await tick();
    clickMainMenuButton(result, "About");
    await tickUpdate(result);
  });

  afterAll(() => {
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
  });

  const about = () => result.find(About).first();

  it("DataViewer: about", async () => {
    expect(result.find(About).length).toBe(1);
    result.find(Modal.Header).first().find("button").simulate("click");
    expect(result.find(About).length).toBe(0);
    clickMainMenuButton(result, "About");
    await tickUpdate(result);
    expect(about().find("div.modal-body div.row").first().text()).toBe(`Your Version:${pjson.version}`);
    expect(about().find("div.modal-body div.row").at(1).text()).toBe(`PyPi Version:${pjson.version}`);
    expect(about().find("div.dtale-alert").length).toBe(0);
  });

  it("DataViewer: about expired version", async () => {
    expect(about().find("div.modal-body div.row").first().text()).toBe(`Your Version:${pjson.version}`);
    expect(about().find("div.modal-body div.row").at(1).text()).toBe("PyPi Version:999.0.0");
    expect(about().find("div.dtale-alert").length).toBe(1);
  });
});
