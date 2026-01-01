import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import pickle

columns = [
    "duration", "protocol_type", "service", "flag", "src_bytes", "dst_bytes", "land", "wrong_fragment",
    "urgent", "hot", "num_failed_logins", "logged_in", "num_compromised", "root_shell", "su_attempted",
    "num_root", "num_file_creations", "num_shells", "num_access_files", "num_outbound_cmds", "is_host_login",
    "is_guest_login", "count", "srv_count", "serror_rate", "srv_serror_rate", "rerror_rate", "srv_rerror_rate",
    "same_srv_rate", "diff_srv_rate", "srv_diff_host_rate", "dst_host_count", "dst_host_srv_count",
    "dst_host_same_srv_rate", "dst_host_diff_srv_rate", "dst_host_same_src_port_rate",
    "dst_host_srv_diff_host_rate", "dst_host_serror_rate", "dst_host_srv_serror_rate", "dst_host_rerror_rate",
    "dst_host_srv_rerror_rate", "label", "difficulty"
]
train_file = 'NSL_KDD_GitHub/NSL_KDD-master/KDDTrain+.csv'
test_file = 'NSL_KDD_GitHub/NSL_KDD-master/KDDTest+.csv'

train_data = pd.read_csv(train_file, names=columns)
test_data = pd.read_csv(test_file, names=columns)

train_difficulty = train_data['difficulty']
test_difficulty = test_data['difficulty']

train_data = train_data.drop('difficulty', axis=1)
test_data = test_data.drop('difficulty', axis=1)

categorical_cols = ['protocol_type', 'service', 'flag']
train_data = pd.get_dummies(train_data, columns=categorical_cols)
test_data = pd.get_dummies(test_data, columns=categorical_cols)

train_data, test_data = train_data.align(test_data, join='inner', axis=1)

feature_cols = [col for col in train_data.columns if col != 'label']

scaler = StandardScaler()
train_data[feature_cols] = scaler.fit_transform(train_data[feature_cols])
test_data[feature_cols] = scaler.transform(test_data[feature_cols])

train_data['label'] = train_data['label'].apply(lambda x: 0 if x == 'normal' else 1)
test_data['label'] = test_data['label'].apply(lambda x: 0 if x == 'normal' else 1)

X_train = train_data[feature_cols]  # Use feature_cols instead of dropping label again
y_train = train_data['label']
X_test = test_data[feature_cols]
y_test = test_data['label']

print("X_train shape:", X_train.shape)
print("y_train shape:", y_train.shape)
print("X_test shape:", X_test.shape)
print("y_test shape:", y_test.shape)

X_train = X_train.astype(np.float32)
X_test = X_test.astype(np.float32)

# Save feature columns
with open("feature_columns.txt", "w") as f:
    for col in X_train.columns:
        f.write(col + "\n")

# Save scaler
with open("scaler.pkl", "wb") as f:
    pickle.dump(scaler, f)

np.save('X_train.npy', X_train.to_numpy())
np.save('y_train.npy', y_train.to_numpy())
np.save('X_test.npy', X_test.to_numpy())
np.save('y_test.npy', y_test.to_numpy())
print("Data saved as NumPy arrays!")

np.save('train_difficulty.npy', train_difficulty.to_numpy())
np.save('test_difficulty.npy', test_difficulty.to_numpy())

print(X_train.dtypes)
print(X_test.dtypes)