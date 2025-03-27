## Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [Rust](https://www.rust-lang.org/tools/install)
- [Angular CLI](https://angular.io/cli)

Note: Currently supports only Linux Platforms

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/ArunVenkata/SmartScreen.git
    cd your-repo
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Build the Tauri application:
    ```bash
    npm run tauri build
    ```

### Running the Application

To start the development server and run the Tauri application:
```bash
npm run tauri dev
```

### Project Structure

- `src-tauri/`: Contains Tauri-specific configuration and Rust code.
- `src/`: Contains Angular application code.

### Building for Production

To create a production build of the application:
```bash
npm run build
npm run tauri build
```

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).