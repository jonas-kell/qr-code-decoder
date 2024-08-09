import cv2
import matplotlib.pyplot as plt

# Load the image
image = cv2.imread("blurred.png")

# Convert the image to grayscale
gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Apply adaptive Gaussian thresholding
size = int(gray_image.shape[0] / 20)
if size % 2 == 0:
    size += 1
block_size = size  # Size of the local region (must be odd)
C = 2  # Constant subtracted from the mean or weighted mean

thresholded_image = cv2.adaptiveThreshold(
    gray_image,
    255,  # Maximum value to use with the THRESH_BINARY thresholding type
    cv2.ADAPTIVE_THRESH_GAUSSIAN_C,  # Adaptive thresholding method
    cv2.THRESH_BINARY,  # Thresholding type
    block_size,  # Size of the local region
    C,  # Constant subtracted from the mean or weighted mean
)

# Display the results
plt.figure(figsize=(10, 5))

plt.subplot(1, 2, 1)
plt.title("Original Image")
plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
plt.axis("off")

plt.subplot(1, 2, 2)
plt.title("Adaptive Gaussian Thresholding")
plt.imshow(thresholded_image, cmap="gray")
plt.axis("off")

plt.show()
