
// A single sample PDF for demonstration purposes.
const samplePdfUrl = 'https://drive.google.com/file/d/1MCHK2uif5hiptlESsN6Ta6XQvYY3tEuS/view?usp=sharing';

const maths = "https://drive.google.com/file/d/1ruJLBjN6-19EvNZd3k4rRSYXbTgq4UGD/view?usp=sharing"
const p_physics = "https://drive.google.com/file/d/1_2tFteLzSj9xbP24dNluhrVpmheuHHBu/view?usp=sharing"
const p_electrical = "https://drive.google.com/file/d/15U_FIPRKnk4gKHkezKeVpswUmgZcFUXH/view?usp=sharing"
const p_cprog = "https://drive.google.com/file/d/1HxcWW4uBiYC9c6ynjaRrSJJd7hbZofme/view?usp=sharing"


const c_chem = "https://drive.google.com/file/d/1eCoSfu0NVnm4xyFmIaf9kTVxXd5vr6oQ/view?usp=sharing"
const c_mechanics  = "https://drive.google.com/file/d/18SiB1QRqjp_7VNgfEuQdg_2Wf29P6249/view?usp=sharing"
const c_cad = "https://drive.google.com/file/d/12Fn2tsKhXjTgYigNCgJXHyesEQG6kivR/view?usp=sharing"


export const data = {
  physics: {
    title: 'Physics Cycle',
    subjects: [
      { 
        id: 'maths_1', name: 'Engineering Mathematics', icon: '📐',
        textbook: [
          { id: 'maths_tb_1', title: 'Mathematics ', url:maths },
        ],
        notes: [
          { id: 'maths_notes_1', title: 'Module 1: Differential Calculus Notes', url: samplePdfUrl },
        ],
        pyqs: [
          { id: 'maths_pyq_2023', title: 'Question Paper - 2023', url: samplePdfUrl },
        ]
      },


      { 
        id: 'physics_eng', name: 'Engineering Physics', icon: '⚛️',
        textbook: [{ id: 'phy_tb_1', title: 'Concepts of Modern Physics', url: p_physics }],
        notes: [{ id: 'phy_notes_1', title: 'Module 1: Quantum Mechanics Notes', url: samplePdfUrl }],
        pyqs: [
            { id: 'phy_pyq_2023', title: 'Question Paper - 2023', url: samplePdfUrl },
            { id: 'phy_pyq_2022', title: 'Question Paper - 2022', url: samplePdfUrl }
        ]
      },


       { id: 'mech_eng', name: 'Elective1- Mechanical Engineering', icon: '⚙️',
        textbook: [],
        notes: [], 
        pyqs: [] 
      },


       { id: 'ele_eng', name: 'Elements of Electrical Engineering', icon: '⚡',
        textbook: [{ id: 'electrical_tb_1', title: 'Electrical and Electronic technology', url: p_electrical }], 
        notes: [], 
        pyqs: [] 
      },


       { id: 'c_prog', name: 'Elective2- Introduction to Programming', icon: '💻', 
        textbook: [{ id: 'c_tb_1', title: 'Ansi C', url: p_cprog }], 
        notes: [], 
        pyqs: [] 
      },


       { id: 'idt', name: 'Innovation & Design thinking', icon: '💡', 
        textbook: [], 
        notes: [], 
        pyqs: [] 
      }
    ]
  },
  chemistry: {
    title: 'Chemistry Cycle',
    subjects: [
      { 
        id: 'chem_eng', name: 'Engineering Chemistry', icon: '⚗️',
        textbook: [{ id: 'chem_tb_1', title: 'Engineering Chemistry', url: c_chem }],
        notes: [],
        pyqs: [{ id: 'chem_pyq_2023', title: 'Question Paper - 2023', url: samplePdfUrl }]
      },

       { id: 'maths_2', name: 'Engineering Mathematics', icon: '📐',
        textbook: [ { id: 'maths_tb_1', title: 'Mathematics ', url:maths },],
        notes: [], pyqs: [] },

       { id: 'mechanics', name: 'Engineering Mechanics', icon: '🔧', 
      textbook: [{ id: 'mech_tb_1', title: 'Mechanics for Engineers', url: c_mechanics }], 
      notes: [], 
      pyqs: [] 
      },

       { id: 'elec_eng', name: 'Elective3- Electronics Engineering', icon: '🔌', textbook: [], notes: [], pyqs: [] },
       { id: 'egd', name: 'Engineering Graphics and Design', icon: '📏', 
        textbook: [{ id: 'cad_tb_1', title: 'Engineering drawing', url: c_cad }], 
        notes: [], 
        pyqs: [] },

       { id: 'sustainability', name: 'Elective3- Sustainability/Skill', icon: '🌱', textbook: [], notes: [], pyqs: [] },

       { id: 'comm_eng', name: 'Communication English', icon: '📝', textbook: [], notes: [], pyqs: [] }
    ]
  }
};
