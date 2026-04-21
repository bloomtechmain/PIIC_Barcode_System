# Pearl Isle Capital — Pawn Manager Setup Guide

## Table of Contents
1. [Accessing the Application](#1-accessing-the-application)
2. [Default Login Credentials](#2-default-login-credentials)
3. [Thermal Printer Driver Installation](#3-thermal-printer-driver-installation)
4. [Printer Configuration](#4-printer-configuration)
5. [Printing Barcode Labels](#5-printing-barcode-labels)
6. [User Roles](#6-user-roles)
7. [First-Time Setup Checklist](#7-first-time-setup-checklist)

---

## 1. Accessing the Application

Open any web browser (Chrome recommended) and go to:

```
https://piicbarcodesystem-production.up.railway.app
```

No installation required — the application runs entirely in the browser.

---

## 2. Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@goldpawn.com | `SuperAdmin@123` |
| Admin | admin@goldpawn.com | `Admin@123` |

> **Important:** Change these passwords immediately after first login.

---

## 3. Thermal Printer Driver Installation

### Download

Download the printer driver from the link below:

📥 **[Download Printer Driver (Google Drive)](https://drive.google.com/drive/folders/1pPI85PAuPGsSyeR9fdZO1NsAfKQ_zMg6?usp=sharing)**

### Installation Steps

1. Open the downloaded folder and run the installer (`.exe` file).
2. Follow the on-screen instructions — click **Next** through each step.
3. When prompted, connect your thermal printer to the computer via USB.
4. Wait for Windows to finish detecting the printer.
5. Click **Finish** to complete the installation.
6. Restart your computer if prompted.

---

## 4. Printer Configuration

After the driver is installed, configure the printer paper size so labels print and cut correctly.

### Open Printer Settings

1. Press `Windows + R`, type `control printers`, press **Enter**.
2. Find your thermal printer in the list, right-click it → **Printing Preferences**.

### Paper / Page Setup

| Setting | Value |
|---------|-------|
| Paper Width | **80 mm** |
| Paper Length | **Auto** (continuous roll) |
| Orientation | **Portrait** |
| Margins | **0 mm** (all sides) |
| Speed | Medium or as recommended |
| Darkness | 8–10 (adjust to taste) |

### Auto-Cut

1. In Printing Preferences, find the **Cutter** or **Cut Mode** option.
2. Set it to **Cut after each document** (or **Full Cut**).
3. Click **Apply** → **OK**.

> If you do not see a Cutter option, look under **Advanced** or **Device Settings**.

---

## 5. Printing Barcode Labels

1. Log in to the application.
2. Go to **Items** and open any item.
3. On the item detail page, click **Print Label**.
4. Your browser will open the system print dialog.
5. Select your thermal printer from the printer list.
6. Click **Print** — the label will print and the cutter will fire automatically.

### If the print dialog does not appear

- Make sure your browser allows the site to open print dialogs.
- Try a different browser (Chrome works best).
- Ensure the printer is powered on and connected.

---

## 6. User Roles

| Role | Access |
|------|--------|
| **Staff** | Items, Customers, Releases, Audits |
| **Admin** | Everything above + Reports, CSV Import, User Registration |
| **Super Admin** | Everything above + Activity Logs |

### Creating a New User

1. Log in as **Admin** or **Super Admin**.
2. There is no user management page — use the register endpoint or ask your system administrator.

---

## 7. First-Time Setup Checklist

- [ ] Open the application at the URL above
- [ ] Log in with Super Admin credentials
- [ ] Change the Super Admin password
- [ ] Log in with Admin credentials
- [ ] Change the Admin password
- [ ] Install the thermal printer driver
- [ ] Configure printer paper size to 80 mm
- [ ] Enable auto-cut in printer preferences
- [ ] Create your first customer and pawn item
- [ ] Print a test barcode label to verify printer output
- [ ] Import existing data via CSV (Admin → Items → Import)
