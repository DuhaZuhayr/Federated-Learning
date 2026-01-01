# NSL-KDD Federated Intrusion Detection

This repository implements a federated learning workflow for intrusion detection using the NSL-KDD dataset. It uses Flower (FLWR) for federated training, TensorFlow/Keras for model definition, and a Streamlit app for single-sample prediction using the saved global model.

---

## Contents

- `server_script.py` : Flower server that orchestrates federated rounds and saves aggregated global models as `global_model_round_{n}.npz`.
- `client_script.py` : Example Flower client that loads per-client numpy training data and participates in training.
- `app.py` : Streamlit user interface to load a saved global model and run single-sample predictions.
- `MLPTrain.py` : (Training helper / standalone model training utilities).
- `Preprocess.py` : Preprocessing utilities used to prepare NSL-KDD data and scaler objects.
- `Split_data.py` : Scripts that split the dataset into clients and save numpy arrays under `client_data/`.
- `Dockerfile.server`, `Dockerfile.client`, `docker-compose.yml` : Docker configurations for server & clients.
- `NSL_KDD_GitHub/` and `NSL_KDD_Kaggle/` : Local dataset copies and related files.

---

**High-level architecture & available endpoints**

- **Flower server (gRPC)**: The federated server listens on `0.0.0.0:8081` by default (see `server_script.py`). This is a gRPC endpoint used by Flower clients to connect — not an HTTP REST endpoint.
- **Streamlit UI**: `app.py` is a UI for predictions. Start it locally (default Streamlit server) and interact via the browser (HTTP endpoint served by Streamlit, typically `http://localhost:8501`).
- **Model files**: Aggregated model weights are saved as `global_model_round_{n}.npz` in the working directory by `SaveModelStrategy` implemented in `server_script.py`.

Note: There are no other HTTP REST APIs in this repository — interactions between server and clients happen over Flower's gRPC protocol.

---

## Quick setup (Python environment)

1. Create a virtual environment and activate it (PowerShell):

```powershell
python -m venv .venv; .\.venv\Scripts\Activate.ps1
```

2. Install required packages (example list):

```powershell
pip install -U pip
pip install tensorflow numpy scikit-learn pandas streamlit flwr
```

3. Ensure required data files and precomputed artifacts exist:
- `X_test.npy`, `y_test.npy` — used by `server_script.py` for evaluation.
- `client_data/` directory containing `X_train_client_{id}.npy` and `y_train_client_{id}.npy` for each client (used by `client_script.py`).
- `feature_columns.txt` and `scaler.pkl` — used by `app.py` for input preprocessing.

If you do not have these files, run the preprocessing/splitting scripts (`Preprocess.py`, `Split_data.py`) to generate them.

---

## Running locally (non-Docker)

- Start the Flower server:

```powershell
python .\server_script.py
```

This will start the Flower server at `0.0.0.0:8081` and run federated training for `num_rounds=3` (configurable in `server_script.py`). After aggregation, the code will save `global_model_round_{n}.npz` files.

- Start one or more clients (in separate terminals). Set the `CLIENT_ID` environment variable to match client files:

```powershell
# example for client id 0
$env:CLIENT_ID = 0; python .\client_script.py

# example for client id 1 (new terminal)
$env:CLIENT_ID = 1; python .\client_script.py
```

- Run the Streamlit UI for predictions:

```powershell
streamlit run .\app.py
```

Open `http://localhost:8501` in your browser to use the prediction UI. The UI expects a saved global model like `global_model_round_3.npz`, `feature_columns.txt` and `scaler.pkl` to exist in the working directory.

---

## Running with Docker / docker-compose

The repository contains `Dockerfile.server`, `Dockerfile.client` and `docker-compose.yml`. The compose setup (if provided) is expected to launch a server and multiple clients.

Typical steps (PowerShell):

```powershell
# Build images
docker-compose build

# Start services (server + clients)
docker-compose up
```

Inspect `docker-compose.yml` for service names and environment variables. Clients typically expect `CLIENT_ID` env var and `client_data/` mounted into the container.

---

## Training, evaluation, and saved artifacts

- `server_script.py` uses `SaveModelStrategy` (a subclass of Flower's FedAvg) which saves aggregated parameters to `global_model_round_{round}.npz`.
- Use `evaluate_global_model(round_num=N)` in `server_script.py` to load and evaluate a saved model against `X_test.npy`/`y_test.npy`.
- The Streamlit UI loads `global_model_round_3.npz` by default — update the path in `app.py` if you saved another round.

Model architecture is an MLP (dense layers with dropout) defined consistently across clients and server.

---

## Files & responsibilities (quick reference)

- `server_script.py` — Start federated server; configures rounds, strategy, and evaluation helper.
- `client_script.py` — Flower client implementation; loads client-specific `X_train`/`y_train` arrays and trains locally.
- `app.py` — Streamlit UI for single-sample inference using a saved global model and scaler.
- `Preprocess.py` — Data cleaning, feature engineering, and scaler creation.
- `Split_data.py` — Splits dataset into per-client numpy arrays and saves them under `client_data/`.
- `MLPTrain.py` — (If present) additional training/experiment utilities.

---

## Dependencies & versions (recommended)

- Python 3.8+ (test with 3.8–3.11)
- TensorFlow 2.x
- flwr (Flower) latest stable release
- numpy, pandas, scikit-learn, streamlit

Install via:

```powershell
pip install tensorflow flwr numpy pandas scikit-learn streamlit
```

---

## Troubleshooting & common issues

- Missing numpy arrays (X_test.npy, client_data/*.npy): Run `Preprocess.py` and `Split_data.py` to generate them. Confirm paths are correct.
- Port conflicts: Flower server listens on port `8081`. Ensure nothing else is using that port or change `server_address` in `server_script.py`.
- Model/weight shape mismatches: Ensure client model architecture matches server architecture exactly.
- Streamlit fails to load model: Confirm `feature_columns.txt` and `scaler.pkl` are present and correspond to the model's expected input columns and scaling.
- Docker file mounting errors: Verify `docker-compose.yml` volumes and relative paths — use absolute paths when necessary on Windows.

---

## Example commands (PowerShell)

```powershell
# Start server
python .\server_script.py

# Start client with ID 0 in a different terminal
$env:CLIENT_ID = 0; python .\client_script.py

# Run Streamlit UI
streamlit run .\app.py
```

---

## Next steps & suggestions

- Add a `requirements.txt` with pinned versions used during development.
- Provide a script that automates preprocessing + splitting + a single `docker-compose` run for reproducibility.
- Add unit tests for preprocessing functions and a small end-to-end smoke test that runs server+1 client for 1 round (if CI is desired).

---

If you'd like, I can:
- generate a `requirements.txt` with likely versions and add it to the repo,
- or create a `run_local.ps1` helper script to launch the server, a client, and the Streamlit UI in separate consoles automatically.

---

© Project
# Federated-Learning
