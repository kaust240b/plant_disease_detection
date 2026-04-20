import os
os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
import tensorflow as tf
import numpy as np
from tensorflow import keras
import cv2


# Flask utils
from flask import Flask, redirect, url_for, request, render_template
from werkzeug.utils import secure_filename
from gevent.pywsgi import WSGIServer

# Define a flask app
app = Flask(__name__)

# Model saved with Keras model.save()

try:
    import tf_keras
    model = tf_keras.models.load_model('PlantDNet.h5', compile=False)
except ImportError:
    try:
        model = tf.keras.models.load_model('PlantDNet.h5', compile=False)
    except Exception as exc:
        raise RuntimeError(
            "Failed to load PlantDNet.h5. This model uses legacy Keras naming. "
            "Install legacy package with `pip install tf-keras` and rerun."
        ) from exc


def model_predict(img_path, model):
    # Match training preprocessing exactly:
    # notebook training uses cv2.imread (BGR) + cv2.resize to (64, 64) + /255.
    img = cv2.imread(img_path, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Unable to read image at path: {img_path}")
    img = cv2.resize(img, (64, 64), interpolation=cv2.INTER_AREA)
    x = np.expand_dims(img, axis=0)
    x = np.array(x, dtype='float32')
    x /= 255
    preds = model.predict(x)
    return preds


@app.route('/', methods=['GET'])
def index():
    # Main page
    return render_template('index.html') #render home page

@app.route('/predict', methods=['GET', 'POST'])
def upload():
    if request.method == 'POST':
        # Get the file from post request
        f = request.files['file']

        # Save the file to ./uploads
        basepath = os.path.dirname(__file__)
        file_path = os.path.join(
            basepath, 'uploads', secure_filename(f.filename))
        f.save(file_path)

        # Make prediction
        preds = model_predict(file_path, model)
        print(preds[0])

        disease_class = ['Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight',
                         'Potato___Late_blight', 'Potato___healthy', 'Tomato_Bacterial_spot', 'Tomato_Early_blight',
                         'Tomato_Late_blight', 'Tomato_Leaf_Mold', 'Tomato_Septoria_leaf_spot',
                         'Tomato_Spider_mites_Two_spotted_spider_mite', 'Tomato__Target_Spot',
                         'Tomato__Tomato_YellowLeaf__Curl_Virus', 'Tomato__Tomato_mosaic_virus', 'Tomato_healthy']
        a = preds[0]
        ind=np.argmax(a)
        result=disease_class[ind]
        return result
    return None


if __name__ == '__main__':
    app.run(debug=True)
