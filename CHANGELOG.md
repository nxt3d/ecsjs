# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-XX

### Added
- Initial release of ecs.js library
- Support for name-based credential resolution
- Support for address-based credential resolution with multiple coin types
- Batch credential resolution functionality
- Comprehensive TypeScript types and interfaces
- Full Viem integration for ENS text record resolution
- Extensive error handling with custom error types
- Utility functions for identifier creation and validation
- Complete unit test suite with high coverage
- Multiple usage examples (basic, batch, error handling, advanced)
- Comprehensive documentation with API reference

### Features
- 🚀 Simple API for resolving ECS credentials
- 🔧 Built on Viem for reliable ENS resolution
- 📝 Full TypeScript support with type safety
- 🎯 Support for both name and address-based identifiers
- 🔄 Efficient batch resolution capabilities
- ⚡ Comprehensive error handling
- 🧪 Well-tested with extensive unit tests
- 📦 Dual package support (CommonJS and ES modules)

### Supported Features
- Name-based credential resolution (`{name}.name.ecs.eth`)
- Address-based credential resolution (`{address}.{coinType}.addr.ecs.eth`)
- Multiple coin type support (Ethereum, Bitcoin, Litecoin, Bitcoin Cash)
- Custom timeout configuration
- Graceful error handling with optional error throwing
- Credential key parsing and validation
- ENS name construction utilities
- Batch processing for multiple credentials

### Dependencies
- Viem ^2.0.0 (peer dependency)
- Node.js 18+ recommended
