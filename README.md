# ci-failure-explainer

[![CI](https://github.com/niuxinhuai/ci-failure-explainer/actions/workflows/ci.yml/badge.svg)](https://github.com/niuxinhuai/ci-failure-explainer/actions/workflows/ci.yml)

Extract likely failure causes, commands, files, and next fixes from CI logs.

从 CI 日志中提取失败原因、失败命令、相关文件和下一步修复建议。

## English

### Install

```bash
npm install -g ci-failure-explainer
```

For local development:

```bash
npm install
npm link
ci-failure-explainer --help
```

### Usage

Read from a log file or stdin.

```bash
ci-failure-explainer ci.log
cat ci.log | ci-failure-explainer
ci-failure-explainer ci.log --json
```

### Status

This is an MVP designed to be useful immediately and easy to extend. It has no runtime dependencies and targets Node.js 18+.

### Test

```bash
npm test
```

## 中文

### 安装

```bash
npm install -g ci-failure-explainer
```

本地开发：

```bash
npm install
npm link
ci-failure-explainer --help
```

### 用法

读取日志文件或标准输入。

```bash
ci-failure-explainer ci.log
cat ci.log | ci-failure-explainer
ci-failure-explainer ci.log --json
```

### 当前状态

这是一个可以直接使用的 MVP，重点是小、清晰、容易二次开发。运行时无第三方依赖，要求 Node.js 18+。

### 测试

```bash
npm test
```
