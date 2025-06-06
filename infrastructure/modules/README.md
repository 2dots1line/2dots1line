# Shared Terraform Modules

This directory contains reusable Terraform modules that can be used across different environments (AWS and Tencent Cloud).

## Structure

- `database/` - Database-related modules (PostgreSQL, Neo4j, Weaviate, Redis)
- `compute/` - Compute-related modules (ECS, containers, serverless functions)
- `networking/` - Networking modules (VPC, security groups, load balancers)

## Usage

These modules are referenced by the environment-specific configurations in:
- `../env-aws/` - US region deployment
- `../env-tencent/` - China region deployment

## Development

When creating new modules:
1. Follow Terraform best practices for module structure
2. Include proper variable validation
3. Provide comprehensive outputs
4. Document all variables and outputs
5. Include examples in the module README 