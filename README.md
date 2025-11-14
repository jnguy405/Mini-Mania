# cmpm-121-F

## Introducing the team

### Tools Lead: Jenalee Nguyen
- Jenalee oversees all aspects of tooling for the project, which includes development workflow decisions, asset pipeline integration, and technical documentation standards. She also monitors tool performance and assists teammates when they need support with asset creation, configuration management, or code integration.
### Engine Lead: Joseph Gonzalez
- Joseph is responsible for the technical core of the game by managing the integration and stability of React.js, Three.js, and Ammo.js. He establishes architectural patterns, reviews core system code, and guides the team on technical feasibility, optimization strategies, and feature implementation.
### Design Lead: William Gonzalez
- William directs the creative direction of the project, gameplay concepts, level structure, and guidelines. He coordinates design documentation, prototypes new mechanics, and scopes.
### Testing Lead: Inho Yoo
- Inho leads all testing efforts, which includes test planning, scenario coverage, bug tracking, and quality assurance workflows. He develops repeatable testing processes, evaluates system stability across updates, and works with the entire team to ensure issues are documented and reproducible.

## Tools and materials

### Stack
- [React.js](https://react.dev/)
- [Three.js](https://threejs.org/)
- [Ammo.js](https://github.com/kripken/ammo.js)
- [JavaScript Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [General ECMAScript Documentation](https://262.ecma-international.org/)
- [Visual Studio Code](https://code.visualstudio.com/)
- [Deno](https://docs.deno.com/examples/react_tutorial/)
- [Vite](https://vite.dev/)
- [Piskel](https://www.piskelapp.com/)
- [Kenney Assets](https://kenney.nl/assets/category:3D)
- [Copilot in VS Code](https://code.visualstudio.com/docs/copilot/ai-powered-suggestions)

1. **Engine**:
- We plan on using React.js together with Three.js and Ammo.js as our core engine layer. Three.js provides a flexible WebGL rendering framework that supports fully 3D environments as well as 2D-style orthographic layouts, which allows us to explore different visual depths while keeping the gameplay approachable. React.js contributes a structured, component-driven architecture that helps us maintain clean organization across systems and interfaces. Ammo.js adds the physics foundation, realistic collision handling, and dynamic object behavior.
2. **Language**:
- JavaScript/JSON -> We will be using JavaScript as our main programming language because our team is already familiar with it and it integrates directly with React.js and Three.js. We will also be using JSON for structuring external data, storing level information, managing configuration files, and organizing reusable game elements.
3. **Tools**: 
- Our project uses a focused set of tools to support art creation, rapid prototyping, clean coding practices, and efficient testing.
    - **IDE: Visual Studio Code (GitHub Codespaces)**: We use VS Code through GitHub Codespaces to ensure that everyone develops inside the same cloud-based environment with consistent dependencies and configuration.
    - **Development Environment - Deno and Vite**: We selected Deno for its secure and modern JavaScript runtime that simplifies dependency management. We use Vite as our build tool because it provides clear configuration options that keep iteration times short.
    - **Proposed Art Tool - Piskel**: Piskel is used to create and refine our pixel art animations. It simplifies sprite sheet generation, supports onion skinning for animation workflows, and lets us export asset files directly into our code pipeline.
    - **Proposed Asset Library - Kenney Assets**: We use the free Kenney asset collections as a foundation for placeholder art and environmental elements. These assets help us prototype quickly while refining our own art style.
4. **Generative AI**: 
- We plan to use generative AI in our project, but we will not be using agentic AI. The reasoning for not using agentic AI is that it makes mistakes and can potentially make large changes to the code that take lots of effort to undo. Generative AI will be mainly used for autocompleting lines or comments. We will not require and leave it up to each team member’s discretion on what features of tools of generative AI they will use. 

## Outlook
1. **What do you anticipate being the hardest or riskiest part of the project?**

- **Connecting art and code smoothly**: React.js, Three.js, and Ammo.js each solve different problems, but combining them introduces complexity. It allows physics updates from Ammo.js with the rendering loop in Three.js while keeping the React state predictable.
- **Keeping good performance in the browser**: Three.js allows for visually rich 3D scenes, but performance can degrade quickly if models, lighting, or physics interactions become too heavy. We may need to optimize scene complexity, material usage, object counts, and physics updates for consistent game performance.
- **Building a stable game**: Our stack requires us to implement or integrate these patterns manually, so it is important to keep the file structure, update loops, and rendering logic organized.

2. **What are you hoping to learn by approaching the project with the tools and materials you selected above?**

- By using Three.js and Ammo.js, it helps us understand how real-time 3D rendering, physics simulation, and game loops work at a lower level, instead of relying on Unity or Unreal. As far as React.js, we hope to learn how to structure game interfaces, configuration panels, and gameplay management using a component-based design.
- Using JSON for our game data will help us learn how to keep code and settings separate. 
- Using Deno and Vite helps us keep a consistent development environment and encourages us to write simple, modular code. 
- Using PISKEL to make sprites and importing them into our project teaches us how real game asset pipelines work. 

