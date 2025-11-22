# Dev Log 11/21/25

## Introducing the team

### Tools Lead: Jenalee Nguyen
- Jenalee oversees all aspects of tooling for the project, which includes development workflow decisions, asset pipeline integration, and technical documentation standards. She also monitors tool performance and assists teammates when they need support with asset creation, configuration management, or code integration.

### Engine Lead: Joseph Gonzalez
- Joseph is responsible for the technical core of the game by managing the integration and stability of Three.js and Cannon-es. He establishes architectural patterns, reviews core system code, and guides the team on technical feasibility, optimization strategies, and feature implementation.

### Design Lead: William Gonzalez
- William directs the creative direction of the project, gameplay concepts, level structure, and guidelines. He coordinates design documentation, prototypes new mechanics, and scopes.

### Testing Lead: Inho Yoo
- Inho leads all testing efforts, which includes test planning, scenario coverage, bug tracking, and quality assurance workflows. He develops repeatable testing processes, evaluates system stability across updates, and works with the entire team to ensure issues are documented and reproducible.

## Tools and materials

### Stack
- [Three.js](https://threejs.org/)
- [Cannon-es](https://github.com/pmndrs/cannon-es)
- [TypeScript](https://www.typescriptlang.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [Vite](https://vite.dev/)
- [Blender](https://www.blender.org/)

1. **Engine**:
- We plan on using Three.js and Cannon-es as our core engine layer. Three.js provides a flexible WebGL rendering framework that supports fully 3D environments as well as 2D-style orthographic layouts. Cannon-es adds the physics foundation, realistic collision handling, and dynamic object behavior with proper TypeScript types.

2. **Language**:
- **TypeScript** -> We will be using TypeScript as our main programming language for its strong typing system, better tooling support, and enhanced code maintainability. TypeScript integrates seamlessly with Three.js while providing better development experience and catching errors at compile time.

3. **Tools**: 
- Our project uses a focused set of tools to support 3D modeling, rapid prototyping, clean coding practices, and efficient testing.
    - **IDE: Visual Studio Code**: We use VS Code for its excellent TypeScript support, integrated terminal, and extensive extension ecosystem.
    - **Development Environment - Node.js and npm**: We selected Node.js as our runtime environment and npm for package management, providing a robust ecosystem for our TypeScript development workflow.
    - **Build Tool - Vite**: We use Vite as our build tool because it provides fast hot module replacement, clear configuration options, and excellent TypeScript support that keeps iteration times short.
    - **3D Modeling - Blender**: Blender is used to create and refine our 3D models, environments, and animations. It provides a comprehensive toolset for 3D asset creation and exports to formats compatible with Three.js.

4. **Generative AI**: 
- We plan to use generative AI in our project, but we will not be using agentic AI. The reasoning for not using agentic AI is that it makes mistakes and can potentially make large changes to the code that take lots of effort to undo. Generative AI will be mainly used for autocompleting lines or comments. We will not require and leave it up to each team member's discretion on what features of tools of generative AI they will use.

## Outlook

1. **What do you anticipate being the hardest or riskiest part of the project?**

- **Connecting art and code smoothly**: Three.js and Cannon-es each solve different problems, but combining them introduces complexity. It requires synchronizing physics updates from Cannon-es with the rendering loop in Three.js while maintaining type safety in a TypeScript environment.
- **Keeping good performance in the browser**: Three.js allows for visually rich 3D scenes, but performance can degrade quickly if models, lighting, or physics interactions become too heavy. We may need to optimize scene complexity, material usage, object counts, and physics updates for consistent game performance.
- **Building a stable game**: Our stack requires us to implement these patterns manually with TypeScript, so it is important to maintain proper type definitions, keep the file structure organized, and ensure update loops and rendering logic are type-safe.

2. **What are you hoping to learn by approaching the project with the tools and materials you selected above?**

- By using Three.js and Cannon-es with TypeScript, it helps us understand how real-time 3D rendering, physics simulation, and game loops work at a lower level with type safety, instead of relying on Unity or Unreal.
- Using TypeScript for our entire codebase will help us learn how to write more maintainable, self-documenting code with proper type definitions and interfaces.
- Using Node.js, npm, and Vite with TypeScript helps us maintain a consistent development environment and encourages us to write simple, modular code with compile-time error checking.
- Using Blender to create 3D models and importing them into our project teaches us how real game asset pipelines work and how to optimize 3D assets for web delivery.