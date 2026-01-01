import os
import numpy as np
import flwr as fl
from tensorflow import keras
import time


CLIENT_ID = int(os.environ.get("CLIENT_ID", 0))
X_train = np.load(f"client_data/X_train_client_{CLIENT_ID}.npy")
y_train = np.load(f"client_data/y_train_client_{CLIENT_ID}.npy")

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

class FlowerClient(fl.client.NumPyClient):
    def __init__(self):
        self.model = get_model(X_train.shape[1])

    def get_parameters(self, config):
        return self.model.get_weights()

    def fit(self, parameters, config):
        self.model.set_weights(parameters)
        self.model.fit(X_train, y_train, epochs=15, batch_size=64, verbose=1)
        return self.model.get_weights(), len(X_train), {}

    def evaluate(self, parameters, config):
        self.model.set_weights(parameters)
        loss, accuracy, precision, recall = self.model.evaluate(X_train, y_train, verbose=0)
        return float(loss), len(X_train), {
            "accuracy": float(accuracy),
            "precision": float(precision),
            "recall": float(recall)
        }

if __name__ == "__main__":
    time.sleep(10)  # Wait 10 seconds for server to start
    # Allow overriding server address via env var when not using Docker
    SERVER_ADDRESS = os.environ.get("SERVER_ADDRESS", "localhost:8081")
    fl.client.start_client(
        server_address=SERVER_ADDRESS,
        client=FlowerClient().to_client(),
    )















    