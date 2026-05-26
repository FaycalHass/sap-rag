# SAP HANA: In-Memory Database Management System

Source: Wikipedia — https://en.wikipedia.org/wiki/SAP_HANA

## Overview

SAP HANA (HochleistungsANalyseAnwendung, or "High-performance ANalysis Application") is an in-memory, column-oriented relational database management system created by SAP SE. The platform functions as a database server while also performing advanced analytics and including extract, transform, load capabilities alongside an application server.

## Architecture

### Core Design Principles

SAP HANA distinguishes itself through three fundamental architectural choices:

**In-Memory Storage**: Data resides in main memory rather than disk, enabling faster data access and query processing. However, this approach increases storage costs. To address this, SAP introduced "Dynamic tiering" in 2016, allowing frequently accessed "hot" data to remain in memory while less frequently used "warm" data resides on disk.

**Column-Oriented Structure**: Unlike traditional row-oriented databases, HANA stores all data for a single column in the same location. This design improves performance for analytical queries on large datasets and enables greater vertical compression of similar data types.

**Hybrid Processing**: HANA combines OLAP (Online Analytical Processing) and OLTP (Online Transaction Processing) operations into a single system, referred to as "online transaction and analytical processing" (OLTAP) or hybrid transactional/analytical processing (HTAP).

### System Components

The Index Server manages several critical functions including session management, authorization, transaction management, and command processing. The system maintains both row store and columnar store capabilities, with the columnar store being more feature-rich and frequently utilized.

The XS Engine enables web application development within the HANA environment.

**XS Advanced (XSA)**: A modern application development platform supporting Node.js and JavaEE natively. Built on Cloud Foundry architecture, XSA implements "Bring Your Own Language" principles, allowing developers to deploy applications in various languages and as microservices. Server-side JavaScript development is supported through SAP HANA XS Javascript (XSJS).

### Concurrency Management

HANA employs Multiversion Concurrency Control (MVCC) to manage concurrent transactions. Rather than overwriting existing data, MVCC marks old data as obsolete and creates new versions, allowing multiple transactions to access consistent database snapshots simultaneously.

## Analytics Capabilities

HANA integrates multiple analytic engines:

- **Business Function Library**: Provides algorithms for common business operations including depreciation calculations, rolling forecasts, and moving averages
- **Predictive Analytics Library**: Native algorithms supporting clustering, classification, and time series analysis
- **R Integration**: The open-source statistical language R is supported within stored procedures
- **Graph Processing**: Handles graph database operations using Cypher Query Language, with pattern matching, neighborhood search, and shortest path algorithms
- **Spatial Database**: Implements spatial data types and SQL extensions; certified by Open Geospatial Consortium and integrated with ESRI's ArcGIS
- **Text Analytics**: Offers fuzzy fault-tolerant search similar to web search engines, entity extraction, and sentiment analysis capabilities

## Development Capabilities

Beyond database functions, HANA serves as a web-based application server with integrated development tools. Application lifecycle management features support development, deployment, and monitoring of user-facing applications, with tight integration between applications and the underlying database and analytics engines.

## Deployment Options

### On-Premises Deployment

HANA can be deployed as a certified appliance from approved hardware vendors or through Tailored Data Center Integration (TDI), which leverages existing storage and network infrastructure. The platform supports multiple operating systems including SUSE Linux Enterprise Server and Red Hat Enterprise Linux, with certified hardware platforms including Intel 64 and IBM POWER Systems. Both horizontal and vertical scaling are supported.

### Cloud Deployment

HANA is available through Infrastructure as a Service offerings from multiple cloud providers:
- Amazon Web Services
- Microsoft Azure
- Google Cloud Platform
- IBM SoftLayer
- Huawei FusionSphere

SAP also provides proprietary cloud services including SAP HANA Enterprise Cloud (managed private cloud) and SAP Business Technology Platform (Platform as a Service).

## Licensing Model

SAP HANA licensing divides into two primary categories:

**Runtime License**: Permits operation of SAP applications such as SAP Business Warehouse and SAP S/4HANA

**Full Use License**: Supports both SAP and non-SAP applications, enabling custom application development

Full Use License features are organized into editions:
- **Base Edition**: Core database features and development tools
- **Platform Edition**: Base capabilities plus spatial, predictive, R integration, search, text, analytics, and graph engines
- **Enterprise Edition**: Platform features plus data loading capabilities and rule framework

Additional streaming and ETL capabilities are licensed separately.

As of March 2017, SAP HANA Express Edition provides a streamlined version supporting up to 32 GB of RAM at no cost, even for production use, with additional capacity available for purchase up to 128 GB.

## Historical Development

The platform was first demonstrated in 2011 through collaboration between SAP, the Hasso Plattner Institute, and Stanford University under the HYRISE architecture name. The first product shipped in November 2010. Support Package Stacks (SPS) serve as the versioning system, releasing updates every six months. SAP HANA 2 launched in November 2016, introducing enhancements to database and application management alongside new cloud services for text analysis and earth observation.
