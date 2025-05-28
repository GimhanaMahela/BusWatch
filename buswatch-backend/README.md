# BusWatch Backend API

## Project Overview

This repository contains the backend API for the **BusWatch** application. The BusWatch application aims to provide a platform for users to report issues related to public bus transportation, such as overcrowding, reckless driving, unscheduled stops, or maintenance concerns. This API handles the submission, processing, and management of these reports, including geospatial data for location, file uploads, and notification services.

## Features

* **Report Submission:** Allows users to submit detailed reports about bus incidents.
* **Geospatial Data:** Stores and processes bus incident locations using MongoDB's `2dsphere` indexing for efficient spatial queries.
* **File Uploads:** Supports uploading images and videos related to the report (via Cloudinary integration).
* **PDF Receipt Generation:** Generates a unique PDF receipt for each submitted report.
* **Email Notifications:** Sends a digital receipt to the passenger's email address upon successful report submission.
* **Report Status Management:** Reports can have statuses like `pending`, `reviewed`, and `resolved`.
* **Robust Validation:** Ensures data integrity with comprehensive schema validation.

## Technologies Used

* **Node.js:** JavaScript runtime environment.
* **Express.js:** Web application framework for Node.js.
* **MongoDB:** NoSQL database for flexible data storage.
* **Mongoose:** ODM (Object Data Modeling) library for MongoDB and Node.js.
* **Cloudinary:** Cloud-based media management service for image and video uploads.
* **Nodemailer (or similar):** For sending email notifications.
* **PDF generation library (e.g., pdfkit, puppeteer):** Used for creating PDF receipts.
* **uuid:** For generating unique identifiers (e.g., for `receiptId`).

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

Before you begin, ensure you have the following installed:

* **Node.js** (LTS version recommended)
* **npm** (comes with Node.js)
* **MongoDB** (running locally or a cloud instance like MongoDB Atlas)
* **Cloudinary Account:** (for image/video uploads)
* **Email Service Credentials:** (e.g., Gmail, SendGrid, Mailgun for Nodemailer)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/YOUR_USERNAME/buswatch-backend.git](https://github.com/YOUR_USERNAME/buswatch-backend.git)
    cd buswatch-backend
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

### Environment Variables

Create a `.env` file in the root directory of the project and add the following environment variables. Replace the placeholder values with your actual credentials.

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/buswatch # Or your MongoDB Atlas URI
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
EMAIL_SERVICE_HOST=smtp.your-email-service.com # e.g., smtp.gmail.com
EMAIL_SERVICE_PORT=587 # e.g., 587 for TLS
EMAIL_SERVICE_USER=your_email_address@example.com
EMAIL_SERVICE_PASS=your_email_password_or_app_specific_password