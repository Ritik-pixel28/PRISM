.PHONY: build-SimulateFunction build-WebFunction

build-SimulateFunction:
	cp -R simulator functions bedrock "$(ARTIFACTS_DIR)/"
	python3 -m pip install -r requirements.txt --target "$(ARTIFACTS_DIR)" --platform manylinux2014_x86_64 --python-version 3.13 --implementation cp --only-binary=:all: --no-compile

build-WebFunction: build-SimulateFunction
	test -f "$(PRISM_STATIC_DIR)/index.html"
	cp -R "$(PRISM_STATIC_DIR)" "$(ARTIFACTS_DIR)/static"
