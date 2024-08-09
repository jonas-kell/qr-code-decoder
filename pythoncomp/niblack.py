from skimage import io, color
from skimage.filters import threshold_niblack
import matplotlib.pyplot as plt

# Load the image
image = io.imread("blurred.png")

# Convert the image to grayscale
gray_image = color.rgb2gray(image)  # `gray_image` will be in range [0, 1]

# Apply Niblack's binarization
# You need to specify the window size and k constant for the Niblack thresholding
size = int(gray_image.shape[0] / 20)
if size % 2 == 0:
    size += 1
window_size = size  # Size of the local neighborhood
k = 0.5  # Constant to be subtracted from the mean (typically between 0.1 and 0.5)

# Calculate the threshold using Niblack's method
threshold = threshold_niblack(gray_image, window_size=window_size, k=k)

# Binarize the image
binary_image = gray_image > threshold

# Display the results
plt.figure(figsize=(12, 6))

plt.subplot(1, 2, 1)
plt.title("Original Image")
plt.imshow(image)
plt.axis("off")

plt.subplot(1, 2, 2)
plt.title("Niblack's Binarization")
plt.imshow(binary_image, cmap="gray")
plt.axis("off")

plt.show()
