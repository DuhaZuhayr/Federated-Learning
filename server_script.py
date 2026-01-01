import flwr as fl
import numpy as np
from tensorflow import keras
from sklearn.metrics import accuracy_score, precision_score, recall_score, classification_report, confusion_matrix

X_test = np.load("X_test.npy")
y_test = np.load("y_test.npy")

def get_model(input_dim):
    model = keras.Sequential([
        keras.layers.Dense(128, activation="relu", input_shape=(input_dim,)),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001),
                  loss="binary_crossentropy",
                  metrics=["accuracy", keras.metrics.Precision(), keras.metrics.Recall()])
    return model

class SaveModelStrategy(fl.server.strategy.FedAvg):
    def aggregate_fit(self, rnd, results, failures):
        aggregated_parameters = super().aggregate_fit(rnd, results, failures)
        if aggregated_parameters is not None:
            # Unpack tuple if needed
            if isinstance(aggregated_parameters, tuple):
                parameters = aggregated_parameters[0]
            else:
                parameters = aggregated_parameters
            weights = fl.common.parameters_to_ndarrays(parameters)
            np.savez(f"global_model_round_{rnd}.npz", *weights)
        return aggregated_parameters

def evaluate_global_model(round_num=3):
    params = np.load(f"global_model_round_{round_num}.npz", allow_pickle=True)
    model = get_model(X_test.shape[1])
    weights = [params[key] for key in sorted(params.files)]
    model.set_weights(weights)
    y_pred_prob = model.predict(X_test)
    y_pred = (y_pred_prob > 0.5).astype(int).flatten()
    accuracy = accuracy_score(y_test, y_pred)
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    print(f"\nGlobal Model Test Accuracy: {accuracy:.4f}")
    print(f"Global Model Test Precision: {precision:.4f}")
    print(f"Global Model Test Recall: {recall:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, y_pred))

if __name__ == "__main__":
    fl.server.start_server(
        server_address="0.0.0.0:8081",
        config=fl.server.ServerConfig(num_rounds=3),
        strategy=SaveModelStrategy(),
    )
    evaluate_global_model(round_num=3)