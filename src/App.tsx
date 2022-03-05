import React, { useCallback, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress, {
  CircularProgressProps,
} from "@mui/material/CircularProgress";

import { DataGrid } from "@mui/x-data-grid";

import "./App.css";

import * as tf from "@tensorflow/tfjs";
import { load as mobilenetLoad } from "@tensorflow-models/mobilenet";
import { load as cocoSsdLoad } from "@tensorflow-models/coco-ssd";
import Box from "@mui/material/Box";
import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";

function App() {
  type GridDataItem = {
    id: string;
    description: string;
    probability: number;
  };

  type GridData = {
    items: GridDataItem[];
  };

  enum TensorflowModel {
    MOBILENET_V2 = "MOBILENET_V2",
    COCO_SSD = "COCO_SSD",
  }

  const [tensorflowModel, setTensorflowModel] = useState<TensorflowModel>(
    TensorflowModel.MOBILENET_V2
  );
  const [gridData, setGridData] = useState<GridData>({ items: [] });
  const [photo, setPhoto] = useState<HTMLImageElement>(new Image());

  useEffect(() => {
    if (tensorflowModel === TensorflowModel.MOBILENET_V2) {
      console.log("Using MobileNet V2");

      mobilenetLoad({ version: 2, alpha: 1 }).then((model) => {
        model.classify(photo).then((predictions) => {
          console.log("Predictions: ");
          console.log(predictions);

          const predictionGridData: GridData = {
            items: predictions.map((prediction, index) => {
              const gridDataItem: GridDataItem = {
                id: `${index}`,
                description: prediction.className,
                probability: prediction.probability,
              };
              return gridDataItem;
            }),
          };

          setGridData(predictionGridData);
        });
      });
    } else if (tensorflowModel === TensorflowModel.COCO_SSD) {
      console.log("Using CocoSSD");

      cocoSsdLoad({ base: "mobilenet_v2" }).then((model) => {
        model.detect(photo).then((predictions) => {
          console.log("Predictions: ");
          console.log(predictions);

          const predictionGridData: GridData = {
            items: predictions.map((prediction, index) => {
              const gridDataItem: GridDataItem = {
                id: `${index}`,
                description: prediction.class,
                probability: prediction.score,
              };
              return gridDataItem;
            }),
          };

          setGridData(predictionGridData);
        });
      });
    }
  }, [photo, tensorflowModel]);

  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  function CircularProgressWithLabel(
    props: JSX.IntrinsicAttributes & CircularProgressProps
  ) {
    return (
      <Box sx={{ position: "relative", display: "inline-flex" }}>
        <CircularProgress variant="determinate" {...props} />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: "absolute",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" component="div" color="text.secondary">
            {`${Math.round(props.value ? props.value : 0)}%`}
          </Typography>
        </Box>
      </Box>
    );
  }

  const cameraInputOnChange = useCallback(
    async (onChangeEvent: React.ChangeEvent<HTMLInputElement>) => {
      console.log("Using TensorFlow backend: ", tf.getBackend());

      const files = onChangeEvent.target.files;
      if (files && files[0]) {
        const image = new Image();
        image.src = await blobToBase64(files[0]);
        setPhoto(image);
      } else {
        console.error("No file was uploaded.");
      }
    },
    []
  );

  return (
    <>
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
        <Box sx={{ display: "inline-flex", margin: "30px" }}>
          <input
            id="contained-button-file"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={cameraInputOnChange}
            hidden
          />
          <label htmlFor="contained-button-file">
            <Button variant="contained" component="span">
              Upload photo
            </Button>
          </label>
        </Box>

        {!!photo && (
          <Box sx={{ display: "inline-flex", margin: "30px" }}>
            <img src={photo.src} style={{ width: "90%" }} />
          </Box>
        )}

        <Box sx={{ display: "inline-flex", margin: "30px", width: "95%" }}>
          <div style={{ height: 350, width: "100%" }}>
            <DataGrid
              density="compact"
              hideFooter
              rowHeight={100}
              rows={gridData.items}
              columns={[
                {
                  field: "description",
                  headerName: "Description",
                  editable: false,
                  width: 250,
                  renderCell: (params) => <span>{params.value}</span>,
                },
                {
                  field: "probability",
                  headerName: "Probability",
                  editable: false,
                  width: 100,
                  renderCell: (params) => (
                    <CircularProgressWithLabel value={params.value * 100} />
                  ),
                },
              ]}
            />
          </div>
        </Box>

        <Box sx={{ minWidth: 120 }}>
          <FormControl fullWidth>
            <InputLabel id="demo-simple-select-label">Model</InputLabel>
            <Select
              labelId="demo-simple-select-label"
              id="demo-simple-select"
              value={tensorflowModel}
              label="Age"
              onChange={(event) => {
                setTensorflowModel(event.target.value as TensorflowModel);
              }}
            >
              <MenuItem value={TensorflowModel.MOBILENET_V2}>
                MobileNet V2
              </MenuItem>
              <MenuItem value={TensorflowModel.COCO_SSD}>Coco SSD</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
    </>
  );
}

export default App;
