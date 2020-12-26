import _ from "lodash";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";

import actions from "./actions/dtale";
import "./adapter-for-react-16";
import { DataViewer } from "./dtale/DataViewer";
import { CodeExport } from "./popups/CodeExport";
import { CodePopup } from "./popups/CodePopup";
import { Correlations } from "./popups/Correlations";
import { ReactFilter as Filter } from "./popups/Filter";
import { ReactUpload as Upload } from "./popups/Upload";
import { ReactColumnAnalysis as ColumnAnalysis } from "./popups/analysis/ColumnAnalysis";
import { ReactCreateColumn as CreateColumn } from "./popups/create/CreateColumn";
import { Describe } from "./popups/describe/Describe";
import { ReactDuplicates as Duplicates } from "./popups/duplicates/Duplicates";
import Instances from "./popups/instances/Instances";
import { PredictivePowerScore } from "./popups/pps/PredictivePowerScore";
import { ReactCreateReplacement as CreateReplacement } from "./popups/replacement/CreateReplacement";
import { ReactReshape as Reshape } from "./popups/reshape/Reshape";
import { Variance } from "./popups/variance/Variance";
import app from "./reducers/dtale";
import { createStore } from "./reducers/store";

require("./publicPath");

let pathname = window.location.pathname;
if (window.resourceBaseUrl) {
  pathname = _.replace(pathname, window.resourceBaseUrl, "");
}
if (_.startsWith(pathname, "/dtale/popup")) {
  require("./dtale/DataViewer.css");

  let rootNode = null;
  const settings = app.toJson(app.getHiddenValue("settings"));
  const dataId = app.getHiddenValue("data_id");
  const chartData = _.assignIn(actions.getParams(), { visible: true }, settings.query ? { query: settings.query } : {});
  const pathSegs = _.split(pathname, "/");
  const popupType = pathSegs[pathSegs.length - 1] === "code-popup" ? "code-popup" : pathSegs[3];

  switch (popupType) {
    case "filter":
      rootNode = <Filter {...{ dataId, chartData }} />;
      break;
    case "correlations":
      rootNode = <Correlations {...{ dataId, chartData }} />;
      break;
    case "pps":
      rootNode = <PredictivePowerScore {...{ dataId, chartData }} />;
      break;
    case "describe":
      rootNode = <Describe {...{ dataId, chartData }} />;
      break;
    case "variance":
      rootNode = <Variance {...{ dataId, chartData }} />;
      break;
    case "build":
      rootNode = <CreateColumn {...{ dataId, chartData }} />;
      break;
    case "duplicates":
      rootNode = <Duplicates {...{ dataId, chartData }} />;
      break;
    case "type-conversion": {
      const prePopulated = {
        type: "type_conversion",
        saveAs: "inplace",
        cfg: { col: chartData.selectedCol },
      };
      rootNode = <CreateColumn {...{ dataId, chartData, prePopulated }} />;
      break;
    }
    case "cleaners": {
      const prePopulated = {
        type: "cleaning",
        cfg: { col: chartData.selectedCol },
      };
      rootNode = <CreateColumn {...{ dataId, chartData, prePopulated }} />;
      break;
    }
    case "replacement":
      rootNode = <CreateReplacement {...{ dataId, chartData }} />;
      break;
    case "reshape":
      rootNode = <Reshape {...{ dataId, chartData }} />;
      break;
    case "column-analysis":
      rootNode = <ColumnAnalysis {...{ dataId, chartData }} height={250} />;
      break;
    case "instances":
      rootNode = <Instances dataId={dataId} iframe={true} />;
      break;
    case "code-export":
      rootNode = <CodeExport dataId={dataId} />;
      break;
    case "upload":
    default:
      rootNode = <Upload chartData={{ visible: true }} />;
      break;
  }
  const store = createStore(app.store);
  store.dispatch(actions.init());
  ReactDOM.render(<Provider store={store}>{rootNode}</Provider>, document.getElementById("popup-content"));
} else if (_.startsWith(pathname, "/dtale/code-popup")) {
  require("./dtale/DataViewer.css");
  document.getElementById("code-title").innerHTML = `${window.opener.code_popup.title} Code Export`;
  ReactDOM.render(<CodePopup code={window.opener.code_popup.code} />, document.getElementById("popup-content"));
} else {
  const store = createStore(app.store);
  store.dispatch(actions.init());
  ReactDOM.render(
    <Provider store={store}>
      <DataViewer />
    </Provider>,
    document.getElementById("content")
  );
}
