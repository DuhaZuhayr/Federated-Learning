import streamlit as st
import numpy as np
import pandas as pd
import pickle
from tensorflow import keras

with open("feature_columns.txt") as f:
    feature_columns = [line.strip() for line in f]
with open("scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

columns = ['duration', 'protocol_type', 'service', 'flag', 'src_bytes', 'dst_bytes', 'land', 
          'wrong_fragment', 'urgent', 'hot', 'num_failed_logins', 'logged_in', 'num_compromised',
          'root_shell', 'su_attempted', 'num_root', 'num_file_creations', 'num_shells',
          'num_access_files', 'num_outbound_cmds', 'is_host_login', 'is_guest_login', 'count',
          'srv_count', 'serror_rate', 'srv_serror_rate', 'rerror_rate', 'srv_rerror_rate',
          'same_srv_rate', 'diff_srv_rate', 'srv_diff_host_rate', 'dst_host_count',
          'dst_host_srv_count', 'dst_host_same_srv_rate', 'dst_host_diff_srv_rate',
          'dst_host_same_src_port_rate', 'dst_host_srv_diff_host_rate', 'dst_host_serror_rate',
          'dst_host_srv_serror_rate', 'dst_host_rerror_rate', 'dst_host_srv_rerror_rate']

protocol_types = ['tcp', 'udp', 'icmp']
services = ['http', 'smtp', 'ftp', 'domain_u', 'auth', 'finger', 'telnet', 'eco_i', 
           'ftp_data', 'other', 'private', 'ecr_i', 'time', 'whois', 'domain', 'ssh']
flags = ['SF', 'S0', 'REJ', 'RSTR', 'RSTO', 'S1', 'RSTOS0', 'S2', 'S3', 'OTH', 'SH']

def preprocess_input(raw_input, feature_columns, scaler):
    """Preprocess user input to match training data format"""
    user_df = pd.DataFrame([raw_input])

    categorical_cols = ['protocol_type', 'service', 'flag']
    dummy_df = pd.get_dummies(user_df, columns=categorical_cols)
    
    final_df = pd.DataFrame(0, index=[0], columns=feature_columns)
    
    for col in dummy_df.columns:
        if col in feature_columns:
            final_df[col] = dummy_df[col]
    
    scaled_data = scaler.transform(final_df)
    
    processed_df = pd.DataFrame(scaled_data, columns=feature_columns)
    
    return processed_df.astype(np.float32)

def get_model(input_dim):
    """Define model architecture"""
    model = keras.Sequential([
        keras.layers.Dense(128, activation="relu", input_shape=(input_dim,)),
        keras.layers.Dropout(0.3),
        keras.layers.Dense(64, activation="relu"),
        keras.layers.Dropout(0.2),
        keras.layers.Dense(1, activation="sigmoid"),
    ])
    model.compile(optimizer=keras.optimizers.Adam(learning_rate=0.001),
                 loss="binary_crossentropy",
                 metrics=["accuracy"])
    return model

@st.cache_resource
def load_global_model(npz_path, input_dim):
    """Load trained model weights"""
    params = np.load(npz_path, allow_pickle=True)
    model = get_model(input_dim)
    weights = [params[key] for key in sorted(params.files)]
    model.set_weights(weights)
    return model

# --- UI ---
st.title("NSL-KDD Intrusion Detection (Federated Global Model)")
st.markdown("Enter the network connection features below:")

# --- Collect user input ---
st.subheader("Basic Features")
duration = st.number_input("duration", value=0)
protocol_type = st.selectbox("protocol_type", protocol_types)
service = st.selectbox("service", services)
flag = st.selectbox("flag", flags)
src_bytes = st.number_input("src_bytes", value=0)
dst_bytes = st.number_input("dst_bytes", value=0)
land = st.number_input("land", value=0)
wrong_fragment = st.number_input("wrong_fragment", value=0)
urgent = st.number_input("urgent", value=0)
hot = st.number_input("hot", value=0)
num_failed_logins = st.number_input("num_failed_logins", value=0)
logged_in = st.number_input("logged_in", value=0)
num_compromised = st.number_input("num_compromised", value=0)
root_shell = st.number_input("root_shell", value=0)
su_attempted = st.number_input("su_attempted", value=0)
num_root = st.number_input("num_root", value=0)
num_file_creations = st.number_input("num_file_creations", value=0)
num_shells = st.number_input("num_shells", value=0)
num_access_files = st.number_input("num_access_files", value=0)
num_outbound_cmds = st.number_input("num_outbound_cmds", value=0)
is_host_login = st.number_input("is_host_login", value=0)
is_guest_login = st.number_input("is_guest_login", value=0)
count = st.number_input("count", value=0)
srv_count = st.number_input("srv_count", value=0)
serror_rate = st.number_input("serror_rate", value=0.0)
srv_serror_rate = st.number_input("srv_serror_rate", value=0.0)
rerror_rate = st.number_input("rerror_rate", value=0.0)
srv_rerror_rate = st.number_input("srv_rerror_rate", value=0.0)
same_srv_rate = st.number_input("same_srv_rate", value=0.0)
diff_srv_rate = st.number_input("diff_srv_rate", value=0.0)
srv_diff_host_rate = st.number_input("srv_diff_host_rate", value=0.0)
dst_host_count = st.number_input("dst_host_count", value=0)
dst_host_srv_count = st.number_input("dst_host_srv_count", value=0)
dst_host_same_srv_rate = st.number_input("dst_host_same_srv_rate", value=0.0)
dst_host_diff_srv_rate = st.number_input("dst_host_diff_srv_rate", value=0.0)
dst_host_same_src_port_rate = st.number_input("dst_host_same_src_port_rate", value=0.0)
dst_host_srv_diff_host_rate = st.number_input("dst_host_srv_diff_host_rate", value=0.0)
dst_host_serror_rate = st.number_input("dst_host_serror_rate", value=0.0)
dst_host_srv_serror_rate = st.number_input("dst_host_srv_serror_rate", value=0.0)
dst_host_rerror_rate = st.number_input("dst_host_rerror_rate", value=0.0)
dst_host_srv_rerror_rate = st.number_input("dst_host_srv_rerror_rate", value=0.0)

# --- Build input dictionary ---
raw_input = {
    "duration": duration,
    "protocol_type": protocol_type,
    "service": service,
    "flag": flag,
    "src_bytes": src_bytes,
    "dst_bytes": dst_bytes,
    "land": land,
    "wrong_fragment": wrong_fragment,
    "urgent": urgent,
    "hot": hot,
    "num_failed_logins": num_failed_logins,
    "logged_in": logged_in,
    "num_compromised": num_compromised,
    "root_shell": root_shell,
    "su_attempted": su_attempted,
    "num_root": num_root,
    "num_file_creations": num_file_creations,
    "num_shells": num_shells,
    "num_access_files": num_access_files,
    "num_outbound_cmds": num_outbound_cmds,
    "is_host_login": is_host_login,
    "is_guest_login": is_guest_login,
    "count": count,
    "srv_count": srv_count,
    "serror_rate": serror_rate,
    "srv_serror_rate": srv_serror_rate,
    "rerror_rate": rerror_rate,
    "srv_rerror_rate": srv_rerror_rate,
    "same_srv_rate": same_srv_rate,
    "diff_srv_rate": diff_srv_rate,
    "srv_diff_host_rate": srv_diff_host_rate,
    "dst_host_count": dst_host_count,
    "dst_host_srv_count": dst_host_srv_count,
    "dst_host_same_srv_rate": dst_host_same_srv_rate,
    "dst_host_diff_srv_rate": dst_host_diff_srv_rate,
    "dst_host_same_src_port_rate": dst_host_same_src_port_rate,
    "dst_host_srv_diff_host_rate": dst_host_srv_diff_host_rate,
    "dst_host_serror_rate": dst_host_serror_rate,
    "dst_host_srv_serror_rate": dst_host_srv_serror_rate,
    "dst_host_rerror_rate": dst_host_rerror_rate,
    "dst_host_srv_rerror_rate": dst_host_srv_rerror_rate
}

# --- Process and predict ---
if st.button("Predict"):
    # Preprocess input
    user_df = preprocess_input(raw_input, feature_columns, scaler)
    
    # Load model and predict
    model = load_global_model("global_model_round_3.npz", input_dim=len(feature_columns))
    pred_prob = model.predict(user_df.to_numpy())[0][0]
    
    # Show results
    st.markdown("---")
    if pred_prob > 0.5:
        st.error(f"Prediction: 🚨 **Attack Detected** (probability: {pred_prob:.2f})")
    else:
        st.success(f"Prediction: ✅ **Normal Connection** (probability: {1-pred_prob:.2f})")