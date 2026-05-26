# ABAP Programming Language

Source: Wikipedia — https://en.wikipedia.org/wiki/ABAP

## Overview

ABAP (Advanced Business Application Programming) is a high-level programming language created by SAP SE. Originally known as "Allgemeiner Bericht-Aufbereitungs-Prozessor" (general report preparation processor in German), it was first developed in the 1980s and remains the primary language for SAP business applications.

The language emerged as one of the many application-specific fourth-generation languages and was initially the report language for SAP R/2, enabling large corporations to build mainframe business applications for materials management and financial accounting.

## Core Characteristics

**Typing System:** Static, strong, safe, nominative typing

**Paradigm:** Object-oriented, structured, imperative programming

**Platform Support:** Cross-platform, running on UNIX, Linux, Windows, IBM System i, and IBM System z

**Database Compatibility:** HANA, SAP ASE, IBM Db2, Informix, MaxDB, Oracle, SQL Server

## Development Timeline

| Version | Year | Key Innovation |
|---------|------|---|
| 4.6C | 2000 | ABAP Objects introduction |
| 6.40 | 2004 | Shared Objects |
| 7.0 | 2006 | Switch framework/Enhancement concept |
| 7.40 | 2012 | Code pushdown, constructor expressions, CDS Views |
| 7.50 | 2015 | New data types, UNION support, path expressions |
| 7.58 | 2023 | CDS scalar functions, simple types, enumerations |

## Language Architecture

### Runtime Environment

All ABAP programs reside in the SAP database in two forms: source code, which can be viewed and edited with the ABAP Workbench tools; and generated code, a binary representation somewhat comparable with Java bytecode.

The system includes a virtual machine-like runtime that processes ABAP statements, controlling the flow logic of screens and responding to events. A critical component is the Database Interface, which converts database-independent ABAP statements (Open SQL) into statements understood by the underlying DBMS (Native SQL).

### System Architecture

SAP systems consist of a central relational database and one or more application servers (instances) accessing the data and programs. Typical landscapes contain three systems: development, testing/QA, and production, managed through the Change and Transport System (CTS).

The Web Application Server operates across three layers:
- **Database Layer:** Relational database and software
- **Application Layer:** System instances running business transactions
- **Presentation Layer:** User interaction via SAP GUI or web browser

## Basic Syntax

### Hello World Example

```abap
REPORT TEST.
WRITE 'Hello, World!'.
```

The REPORT statement indicates that this program is a report.

### Structural Features

**Comments:** Two methods exist—asterisks (*) in the leftmost column or double quotation marks (") to comment remainder of line

**Chained Statements:** Using colon operator to combine similar statements:
```abap
WRITE: FIELD1, FIELD2, FIELD3.
```

**Whitespace Sensitivity:** Spacing affects interpretation:
- `x = a+b(c)` extracts a substring
- `x = a + b( c )` performs addition and method call

**Statement Structure:** Each statement ends with a period. Words must always be separated by at least one space.

## Data Types and Variables

### Built-in Types

| Type | Purpose |
|------|---------|
| I | Integer |
| P | Packed decimal |
| F | Floating point |
| N | Character numeric |
| C | Character |
| D | Date |
| T | Time |
| X | Hexadecimal |
| STRING | Variable-length string |
| XSTRING | Variable-length raw bytes |

### Declaration Methods

**Explicit Typing:**
```abap
DATA: COUNTER TYPE I,
      LASTNAME(20) TYPE C,
      DESCRIPTION TYPE STRING.
```

**Inline Declaration (ABAP 7.40+):**
```abap
DATA(variable_name) = 'VALUE'.
```

This requires the type to be statically inferrable, e.g. by method signature or database table structure.

## Object-Oriented Programming

### ABAP Objects

Introduced in release 4.6, ABAP Objects provides fully compatible object-oriented capabilities. The feature helps to simplify applications and make them more controllable.

**Core Concepts:**

- **Objects:** Instances of classes. They contain data and provide services.
- **Classes:** Describe objects. From a technical point of view, objects are runtime instances of a class.
- **Object References:** Unique addresses that may be used to identify and point to objects in a program.

**OO Principles:**

1. **Encapsulation:** Objects restrict the visibility of their resources (attributes and methods) to other users.
2. **Inheritance:** An existing class may be used to derive a new class. Derived classes inherit the data and methods of the superclass.
3. **Polymorphism:** Identical (identically named) methods behave differently in different classes.

## Program Types

### Executable Programs

**Reports:** Follow a relatively simple programming model whereby a user optionally enters a set of parameters and the program then uses the input parameters to produce a report in the form of an interactive list.

**Module Pools:** Define complex user interactions through screens. Each screen contains a flow logic divided into:
- **PBO (Process Before Output)**
- **PAI (Process After Input)**

### Reusable Components

- **INCLUDE Modules:** Subdivide large programs
- **Subroutine Pools:** Contain ABAP subroutines (FORM/ENDFORM)
- **Function Groups:** Libraries of self-contained function modules
- **Object Classes:** Similar to Java classes with methods and attributes
- **Type Pools:** Define collections of data types and constants

## Development Environments

### ABAP Workbench Transactions

Integrated environment accessed via SAP GUI, containing:

- **ABAP Editor (SE38):** Write and edit reports, module pools
- **ABAP Dictionary (SE11):** Database table definitions and global types
- **Menu Painter (SE41):** User interface design
- **Screen Painter (SE51):** Screen and flow logic design
- **Function Builder (SE37):** Function modules
- **Class Builder (SE24):** ABAP Objects classes and interfaces
- **Object Navigator (SE80):** Single integrated interface

### ABAP Development Tools (ADT)

Modern Eclipse-based alternative providing a set of plugins for the Eclipse IDE to develop ABAP objects. Developers work locally with continuous synchronization with the backend.

## ABAP Dictionary

The metadata repository containing all metadata about the data in the SAP system. Key object types:

**Tables:** Data containers in the underlying database. Three variants:
- Transparent tables (1-to-1 relationship with database)
- Pooled tables (grouped in large physical pools)
- Clustered tables (grouped by primary keys for performance)

**Indexes:** Provide accelerated access. Every SAP table has a primary index, which is created implicitly along with the table.

**Views:** Define subsets of columns (and/or rows) from one or—using a join condition—several tables.

**Structures:** Complex data types with multiple fields, comparable to structs in C/C++

**Data Elements:** Provide the semantic content for a table or structure field.

**Domains:** Define the structural characteristics of a data element.

**Search Helps:** Advanced search strategies for data field value discovery

**Lock Objects:** Implement application-level locking when changing data

## Internal Tables

A fundamental ABAP feature providing dynamic arrays for storing variable data sets. Each row has uniform structure.

**Example Definition:**
```abap
TYPES: BEGIN OF t_vbrk,
  VBELN TYPE VBRK-VBELN,
  ZUONR TYPE VBRK-ZUONR,
END OF t_vbrk.

DATA : gt_vbrk TYPE STANDARD TABLE OF t_vbrk.
```

Internal tables are preferably used to store and format the content of database tables from within a program.

## Core Data Services (CDS)

ABAP CDS enables semantic data models on the central database of the application server. Models provide enhanced access functions when compared with existing database tables and views.

### CDS Features (Version 7.58)

**SQL Operations:** JOINs (INNER, LEFT OUTER, RIGHT OUTER, CROSS), UNIONs, set operations (INTERSECT, EXCEPT)

**Functions:**
- Aggregate: AVG, MAX, MIN, SUM, COUNT
- Numeric: CEIL, ABS, MOD, FLOOR, ROUND
- String: SUBSTRING, CONCAT, UPPER, LOWER, LTRIM, RTRIM
- Date/Time: DATS functions, timestamp operations
- Other: CAST, COALESCE, CASE expressions

**Advanced Features:**
- Typed literals for explicit type declaration
- CDS scalar functions (ABAP 7.58)
- CDS simple types and enumerations (ABAP 7.58)
- Path expressions with filter conditions
- Input parameters and session variables
- Metadata extensions

**Entity Types:**
- CDS View Entities (ABAP 7.55+)
- CDS Projection Views
- CDS Transactional Interfaces
- CDS Analytical Projection Views
- CDS Custom Entities

CDS source code can only be programmed in the Eclipse-based ABAP Development Tools (ADT).

## Transactions

In SAP terminology, a transaction is the execution of a program. Access occurs through transaction codes (T-codes). Common developer codes include SE38 (ABAP Editor), SE11 (Dictionary), SE24 (Class Builder), SE80 (Object Navigator).

Transactions can be called via system-defined or user-specific, role-based menus. They can also be started by entering the transaction code directly into a command field.

The general concept is termed Logical Unit of Work (LUW).

## Modern ABAP Enhancements

### Constructor Expressions (ABAP 7.40+)

NEW, VALUE, REF, CONV, CAST, EXACT, COND, SWITCH operators enable expression-based programming alongside traditional statements.

### Table Expressions

Direct access to table lines without explicit LOOP statements, supporting filters and default values.

### FOR and REDUCE Expressions (ABAP 7.40 SP08+)

Enable functional programming patterns for internal table manipulation.

### GROUP BY (ABAP 7.40 SP08+)

Aggregate internal table data using grouping logic.

## Recent Evolution (7.54–7.58)

- **Calculation Assignments:** +=, -=, *=, /= operators
- **Window Functions:** FIRST_VALUE, LAST_VALUE, NTILE
- **Date/Time Enhancements:** TIMESTAMPL support, precise fractional seconds
- **Entity Manipulation Language (EML):** ABAP RESTful Application Programming Model enhancement
- **RAP Extensions:** Business service definitions, authorization controls, scenario-based access
- **Strict Mode Syntax Checking:** Enforced for new features
- **CDS View Entities:** Supersede DDIC-based views (now obsolete)

## Key Design Principles

ABAP maintains abstraction between the business applications, the operating system and database. This ensures that applications do not depend directly upon a specific server or database platform and can easily be ported from one platform to another.

With keywords, additions and operands, the ABAP runtime system does not differentiate between upper and lowercase, providing flexibility in code style while maintaining consistency.

The language supports both statement-based syntax (whose syntax originates in COBOL) and expression-based syntax (as in C/Java), accommodating traditional and modern programming preferences.
