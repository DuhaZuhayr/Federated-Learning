import numpy as np
import os

X_train = np.load('X_train.npy')
y_train = np.load('y_train.npy')

num_clients = 5  # Change this to the number of clients you want

# Shuffle before splitting
indices = np.arange(X_train.shape[0])
np.random.seed(42)
np.random.shuffle(indices)
X_train = X_train[indices]
y_train = y_train[indices]

split_X = np.array_split(X_train, num_clients)
split_y = np.array_split(y_train, num_clients)

os.makedirs('client_data', exist_ok=True)
for i in range(num_clients):
    np.save(f'client_data/X_train_client_{i}.npy', split_X[i])
    np.save(f'client_data/y_train_client_{i}.npy', split_y[i])

print(f"Data split into {num_clients} clients and saved in 'client_data/' folder.")